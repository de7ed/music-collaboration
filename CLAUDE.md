# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

### Common Commands

```bash
# Development server (hot reload) — use wrapper to ensure Node 20 is on PATH
./start-dev.sh                 # Preferred: sets Node 20 path + runs npm run dev
npm run dev                    # Direct, if Node 20 is already active

# Production build and run
npm run build                  # Runs prisma generate + next build
npm start

# Linting
npm run lint

# Database migrations
npx prisma migrate dev         # Apply migrations + regenerate Prisma client
npx prisma generate            # Regenerate client only (after schema changes)
npx prisma studio              # Browse DB in browser

# Scripts
npx tsx scripts/bootstrap-admin.ts
npx tsx scripts/list-clerk-users.ts
```

**Node version:** Node 20 is required. The system may default to an older version — `start-dev.sh` sets the correct PATH. If running commands directly, prefix with `PATH="/opt/homebrew/opt/node@20/bin:$PATH"`.

## Architecture Overview

### Authentication & Authorization

- **Clerk** (passwordless auth): Handles sign-up, sign-in, password reset
- **Pending Approval Flow**: New signups create a `User(PENDING)` in the database. Admins approve via `/admin/users`, which updates Clerk's `publicMetadata.status = "active"`
- **Middleware** (`src/middleware.ts`): On each protected request, fetches user status from Clerk directly (not JWT caching) and:
  - Redirects unauthenticated users to `/sign-in`
  - Redirects pending/rejected/suspended users to `/pending`
  - Blocks non-admin users from accessing `/admin/*`
- **Public Routes**: `/`, `/sign-in`, `/sign-up`, `/pending`, `/share/*`, Clerk webhooks

### Data Model

**Users & Auth:**
- `User` — stores account state (clerkId, email, name, role: ADMIN | STANDARD, status: PENDING | ACTIVE | REJECTED | SUSPENDED)
- `Invite` — outbound invites with email + expiry, sent via Resend

**Sheets (Lyric & Music):**
- `LyricSheet` — title, owner, visibility (PRIVATE | PUBLIC), content (JSON from TipTap)
- `LyricSheetVersion` — stores all revisions (autosaves AND manual check-ins)
- `MusicSheet` — mirrors LyricSheet plus file metadata (key, mimeType, sizeBytes)
- `ShareLink` — public tokens for generating public preview URLs (`/share/[token]`)
- Both support tagging (`LyricSheetTag`, `MusicSheetTag`) and per-user sharing (`LyricSheetShare`, `MusicSheetShare` with permission: VIEWER | EDITOR)

**Comments & Collaboration:**
- `Comment` — text + optional anchor (text position for lyrics, page number for PDFs)
- Soft-deleted via `deletedAt` (never hard-deleted for audit trail)
- Threaded via `parentId` (root comments + nested replies)
- `CommentMention` — tracks @mentions for notification dispatch

**Notifications:**
- `Notification` — type + payload (JSON) + readAt
- `NotificationPreference` — per-user toggles for 7 notification types, each with inApp and email flags
- Types: MENTIONED_IN_COMMENT, NEW_COMMENT_ON_OWNED/SHARED/PUBLIC, ACCOUNT_APPROVED/REJECTED, INVITE_ACCEPTED

### Versioning

LyricSheets auto-save every 2 seconds (debounced) and store a single drafty `LyricSheetVersion(isCheckIn: false)`. Manual "Check in" creates a new row with `isCheckIn: true` + user message for audit trail.

The `LyricSheet.content` field is always denormalized with the latest content, so reads don't need to JOIN versions.

### Real-Time Notifications (SSE)

- **Dispatcher** (`src/lib/notifications/dispatch.ts`): Central function that (1) inserts Notification row, (2) checks user preferences, (3) pushes to open SSE connections, (4) sends email via Resend
- **Connections** (`src/lib/sse/connections.ts`): In-process Map<userId, Set<Controller>> tracks open streams. Push via `pushToUser(userId, data)` broadcasts to all tabs for that user
- **Stream Endpoint** (`/api/notifications/stream`): EventSource connection; heartbeats every 25s to survive proxies
- **Client** (`SSEProvider`): Automatically reconnects on disconnect and re-fetches missed notifications

### File Storage

Abstracted via `StorageProvider` interface (`src/lib/storage/index.ts`):
- **Dev**: Local filesystem at `/storage/uploads/`, served via `/api/files/[...key]`
- **Prod**: AWS S3 with presigned PUT URLs (client uploads directly, confirms with server)
- Set via `STORAGE_PROVIDER` env var (`local` or `s3`)

### Comments Anchoring

- **Lyric sheets**: Store `{ type: "text", from: N, to: N, text: "exact quoted" }`. On render, if positions match, highlight there; if stale, forward-search for text; if missing, show as "unanchored"
- **Music sheets**: Store `{ type: "page", page: N }` — simpler, page-pinned

## Key Directories & Patterns

```
src/
├── app/
│   ├── (app)/             # Authenticated routes (wrapped in auth shell with sidebar)
│   │   ├── lyric-sheets/  # Create, list, edit lyric sheets; includes /[id]/history for versions
│   │   ├── music-sheets/  # Mirror of lyric sheets, plus file upload
│   │   ├── feed/          # Real-time notification feed (All / Unread tabs)
│   │   └── settings/      # Profile name, invite form, notification preferences
│   ├── admin/             # /admin/users — approve/reject pending signups
│   ├── (marketing)/       # Unauthenticated: /, /sign-in, /sign-up
│   ├── pending/           # "Account awaiting approval" page
│   ├── share/             # Public preview page: /share/[token]
│   └── api/               # 40+ API routes for all CRUD operations
│
├── components/
│   ├── lyric-sheets/      # LyricEditor (TipTap + autosave), VersionHistory, ShareDialog
│   ├── music-sheets/      # Upload form, PDF viewer, mirrors share/comment UI
│   ├── comments/          # CommentPanel, CommentThread, CommentComposer with @mention autocomplete
│   ├── notifications/     # SSEProvider, NotificationBell, NotificationFeed
│   ├── ui/                # Base UI primitives (Button, Input, Modal, Dialog, etc.)
│   └── layout/            # Sidebar, AppShell
│
├── lib/
│   ├── notifications/dispatch.ts  # Insert notification → check prefs → push SSE + email
│   ├── sse/                       # connections.ts (registry), emitter.ts (dispatch integration)
│   ├── storage/                   # Swappable local vs S3 implementation
│   ├── email/                     # Resend integration + email templates
│   └── sheet-access.ts            # Permission checks (owner, VIEWER/EDITOR share, public)
│
├── context/
│   └── notification-context.tsx   # Client state for in-app notifications
└── middleware.ts                  # Auth guard + pending redirect
```

## Environment Variables

```bash
# Database (Prisma 7 + pg adapter)
DATABASE_URL="postgresql://user:pass@host/dbname?channel_binding=require&sslmode=require"

# Clerk (test or production keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@domain.com"    # Use "onboarding@resend.dev" until domain is verified in Resend

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Used in invite/reset links

# Storage
STORAGE_PROVIDER="local"                    # local or s3
# If s3:
# AWS_REGION="us-east-2"
# AWS_ACCESS_KEY_ID="..."
# AWS_SECRET_ACCESS_KEY="..."
# AWS_S3_BUCKET="..."
```

## Database Setup (Local Dev)

```bash
# Start PostgreSQL (Docker)
docker-compose up -d

# Run migrations + create Prisma client
npx prisma migrate dev

# Seed with admin account (if desired)
npx tsx scripts/bootstrap-admin.ts
```

## Important Patterns

### Permission Checks

All sheet operations (`GET`, `PATCH`, `DELETE`) use `getLyricSheetWithAccess(sheetId, userId)` from `src/lib/sheet-access.ts`. Returns `{ sheet, isOwner, permission }` or null if no access. Checks:
1. Owner → full access
2. PUBLIC visibility → read-only (VIEWER for comments)
3. PRIVATE + share record → permission from share
4. Otherwise → null

### API Response Pattern

```typescript
// Get with access check
const result = await getLyricSheetWithAccess(id, user.id)
if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
if (!result.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

// Operate on result.sheet
```

### Notification Dispatch

```typescript
// In any action (comment, share, approval)
await dispatch({
  userId,
  type: "NEW_COMMENT_ON_OWNED",
  payload: { lyricSheetId: id, commentAuthorName: author.name },
})
// Automatically: inserts row, checks prefs, pushes SSE, sends email
```

### Comment Anchoring

```typescript
// Lyric: store position + text for resilience
const anchor = { type: "text", from: 0, to: 5, text: "Verse" }

// On render: if anchor.text found at positions → highlight; if moved → search for text
```

## Deployment & Production Notes

### Vercel

- Deployment is automatic on git push to main (after passing build + lint)
- Database URL, Clerk keys, and Resend key must be set in Vercel Project Settings → Environment Variables
- `npm run build` runs `prisma generate && next build`, so schema changes don't need manual Prisma steps

### Clerk Production Keys

Switch to `pk_live_` and `sk_live_` keys when going live. These are separate from test keys. The database and notification flow remain identical.

### S3 Setup

1. Create AWS S3 bucket
2. Add bucket name, region, and credentials to `.env`
3. Change `STORAGE_PROVIDER` to `s3`
4. Set `CORS` policy on bucket to allow presigned uploads from your domain

### Resend Domain

To send from your own domain instead of `onboarding@resend.dev`:
1. Go to resend.com/domains
2. Add and verify your domain
3. Update `RESEND_FROM_EMAIL` env var

## Testing Notes

- **No test suite yet** — manual testing via the UI is the current approach
- TipTap editor autosave can be tested by editing a lyric sheet and checking that edits persist after page reload
- Notifications can be tested by commenting on a sheet you don't own, then checking the notification bell and feed
- Share links work by generating a token and sharing `/share/[token]` with logged-out users

## Performance & Scaling

- **SSE Connections**: In-process Map works for dev/single-instance. For multi-instance Vercel, swap `src/lib/sse/emitter.ts` to use Redis pub/sub (API unchanged for callers)
- **Database Queries**: Most list endpoints paginate and filter efficiently. Comment threads are denormalized (replies fetched with parent) to reduce N+1 queries
- **Autosave**: Debounced 2 seconds; each save is a single upsert, not unbounded growth

## Troubleshooting

- **Auth stuck on pending**: Middleware fetches user status directly from Clerk on every request. If bootstrapping fails, check that the Clerk API key is correct and that the user clerkId is accurate
- **Notifications not appearing**: Check `src/lib/notifications/dispatch.ts` is being called, that notification preferences aren't disabled for the type, and that the SSE connection is open (check Network tab in devtools)
- **Comments not saving**: Comment CRUD lives in `/api/lyric-sheets/[id]/comments` and `/api/music-sheets/[id]/comments`. Check that the sheet ID is correct and user has permission
