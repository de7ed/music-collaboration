# Music Collab

A private, invite-only web app for bands and collaborators to write, share, and refine lyrics and sheet music together in real-time.

## Features

- **Authentication** — Invite-only signup with admin approval workflow
- **Lyric Sheets** — Rich text editor (TipTap) with autosave, manual versioning, and full version history
- **Music Sheets** — PDF file uploads, linked to lyric sheets
- **Comments & Collaboration** — Threaded comments with @mentions, anchored to specific lyrics or pages
- **Real-time Notifications** — In-app notification feed + email notifications (configurable per type)
- **Sharing** — Per-sheet sharing with granular permission levels (Viewer / Editor)
- **Public Links** — Generate public preview links for songs (logged-out visitors see read-only lyrics + comments)
- **Tagging** — Freeform tags, filterable by sheet
- **Grouping** — List views support grouping by visibility, owner, or tag

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, React 19, TipTap (rich text), Tailwind CSS + Base UI
- **Backend**: Next.js API routes, Node.js 20+
- **Database**: PostgreSQL 16, Prisma 7 ORM with pg adapter
- **Auth**: Clerk (passwordless)
- **Notifications**: Server-Sent Events (SSE) + Resend (email)
- **Storage**: Local FS (dev) / AWS S3 (prod, presigned uploads)

## Quick Start

### Prerequisites

- **Node.js 20+** (required; system Node 9 is too old)
- **PostgreSQL 16+** (local or Docker)
- **Clerk account** (free tier OK)
- **Resend account** (free tier OK for dev, paid for production email)

### Setup

```bash
# 1. Set Node 20 path
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# 2. Install dependencies
npm install

# 3. Start PostgreSQL (if using Docker)
docker-compose up -d

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your Clerk keys, database URL, Resend key, etc.

# 5. Run database migrations
npx prisma migrate dev

# 6. Bootstrap admin account (optional, for local testing)
npx tsx scripts/bootstrap-admin.ts

# 7. Start dev server
npm run dev
# Open http://localhost:3000
```

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for a detailed architecture guide, including:
- Authentication & authorization flow
- Data model (sheets, versions, comments, notifications)
- Real-time notification dispatch (SSE)
- File storage abstraction
- Key patterns and utilities
- Production deployment notes

Quick reference:
```
src/
├── app/              # Next.js App Router (40+ API routes + pages)
├── components/       # React components (UI, editors, comment panels)
├── lib/              # Utilities (notifications, storage, permissions, SSE)
└── middleware.ts     # Auth guard + pending user redirect
```

## Development

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Production build
npm start            # Run production server
npm run lint         # ESLint + Next.js linting
```

## Deployment

Deployed on **Vercel**. Automatic on git push to main (after build + lint).

**Environment Variables** (set in Vercel):
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- Database: `DATABASE_URL` (e.g., Neon PostgreSQL)
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- App: `NEXT_PUBLIC_APP_URL`
- Storage: `STORAGE_PROVIDER`, AWS credentials (if using S3)

## Workflow

### For New Users
1. Visit landing page → "Request access" → sign up with email
2. User enters pending approval state
3. Admin approves via `/admin/users` dashboard
4. User logs back in → full app access

### For Collaborators
1. Owner creates a lyric sheet → writes lyrics with TipTap editor
2. Owner shares sheet with specific users (Viewer / Editor permissions)
3. Collaborators comment on specific lyrics or lines
4. Notifications trigger on @mentions, new comments, approvals
5. Owner can version-control edits with manual "Check in" messages
6. Owner can generate public share link for non-users to preview

## File Storage

- **Development**: Saved to `/storage/uploads/`, served via `/api/files/[...key]`
- **Production**: Presigned S3 uploads (client uploads directly, server confirms)

Configure via `STORAGE_PROVIDER` env var (`local` or `s3`).

## Real-time Notifications

Notifications are **Server-Sent Events (SSE)** via `/api/notifications/stream`:
- Client opens persistent EventSource connection
- Server pushes notifications as they're created
- Falls back to email based on user preferences (togglable per notification type)

Types: @mention, comment on owned sheet, comment on shared sheet, comment on public sheet, account approval/rejection, invite accepted.

## Public Share Links

Generate a public preview link from any lyric sheet:
1. Open the sheet → click **"Share link"** button
2. Click **"Generate share link"** → copy URL
3. Share `https://your-domain/share/[token]` with anyone

Logged-out visitors see:
- Full lyrics read-only (with rich text formatting)
- Comments thread read-only
- "Sign up to comment" prompt if they try to reply

Logged-in collaborators see a button to "Open in Music Collab" to edit.

## Troubleshooting

**Auth stuck on pending after admin approval?**
- Middleware fetches user status directly from Clerk on each request
- Try signing out → signing back in to refresh session
- Check Clerk dashboard to confirm publicMetadata is set

**Notifications not appearing?**
- Check notification preferences in Settings → Notifications
- Verify SSE connection is open (Network tab in devtools, `/api/notifications/stream`)
- Check email settings if email notifications expected

**Comments not saving?**
- Ensure you have permission on the sheet (owner or shared with EDITOR)
- Check browser console for errors

See [CLAUDE.md](./CLAUDE.md) **Troubleshooting** section for more.

## Contributing

This is a private project. Access is invite-only via the app.

## License

Private — All rights reserved.
