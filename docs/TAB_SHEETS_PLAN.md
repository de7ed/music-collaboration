# Tab Sheets — Design & Implementation Plan

A plan for adding **interactive tablature / notation** as a first-class sheet type
in Riff Session, parallel to Lyric Sheets and Music Sheets.

## Core decision: text-based notation (alphaTex), not a graphical editor

We render with **[alphaTab](https://www.alphatab.net/)** (`@coderline/alphatab`)
and author in **alphaTex**, its human-writable text format. This is the single most
important architectural choice because it lets a Tab Sheet reuse almost everything
we already built for Lyric Sheets:

| Concern | Lyric Sheet today | Tab Sheet (proposed) | Reuse? |
|---|---|---|---|
| Storage | `content: Json` (TipTap) | `content: Json` = `{ format, source }` | ✅ same column shape |
| Autosave | debounced upsert of one draft version | identical | ✅ |
| Versioning / check-in | append `isCheckIn` row | identical | ✅ |
| Comments | text anchor `{from,to,text}` | text anchor into the alphaTex source | ✅ same model |
| Sharing / permissions | owner / VIEWER / EDITOR / public | identical | ✅ |
| Public share link | `/share/[token]` | extend to render alphaTex read-only | ✅ pattern |

A graphical WYSIWYG note editor would instead force us into CRDT/OT collaboration,
custom engraving, and a bespoke anchoring scheme — person-years of work. The
text format keeps us on rails we already own.

### Why alphaTab specifically
- Renders **tablature *and* standard notation** to SVG.
- Built-in **playback** (SoundFont synth) with a moving cursor — huge for a band tool.
- Accepts **alphaTex** text directly: `api.tex(sourceString)`.
- Can also **import Guitar Pro files** (`.gp3/4/5/gpx`) if collaborators have them.
- Framework-agnostic; React integration is a `ref` + `useEffect`.

alphaTex example:
```
\title "Riff Idea"
\tempo 120
.
:4 3.3 5.3 7.3 | (0.1 0.2).4 :8 2.4 2.4
```

---

## 1. Data model (Prisma)

Mirror `LyricSheet` almost exactly. The only real difference is the `content`
shape and a couple of optional render hints.

```prisma
model TabSheet {
  id         String     @id @default(cuid())
  title      String
  ownerId    String
  owner      User       @relation("Owner", fields: [ownerId], references: [id])
  visibility Visibility @default(PRIVATE)

  // content is a tagged union (see §8):
  //   { format: "alphatex",  source: "<alphaTex string>" }
  //   { format: "guitarpro", fileKey: "<storage key>" }
  content    Json       @default("{}")

  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  versions   TabSheetVersion[]
  shares     TabSheetShare[]
  tags       TabSheetTag[]
  comments   Comment[]         @relation("TabSheetComments")
  shareLinks ShareLink[]

  @@index([ownerId])
  @@index([visibility])
}

model TabSheetVersion {
  id          String   @id @default(cuid())
  tabSheetId  String
  tabSheet    TabSheet @relation(fields: [tabSheetId], references: [id], onDelete: Cascade)
  content     Json
  isCheckIn   Boolean  @default(false)
  message     String?
  createdById String
  createdAt   DateTime @default(now())

  @@index([tabSheetId, createdAt])
  @@index([tabSheetId, isCheckIn])
}

model TabSheetShare {
  id         String          @id @default(cuid())
  tabSheetId String
  tabSheet   TabSheet        @relation(fields: [tabSheetId], references: [id], onDelete: Cascade)
  userId     String
  user       User            @relation(fields: [userId], references: [id])
  permission SharePermission @default(VIEWER)
  createdAt  DateTime        @default(now())

  @@unique([tabSheetId, userId])
  @@index([userId])
}

model TabSheetTag {
  tabSheetId String
  tabSheet   TabSheet @relation(fields: [tabSheetId], references: [id], onDelete: Cascade)
  tagId      String
  tag        Tag      @relation(fields: [tagId], references: [id])

  @@id([tabSheetId, tagId])
}
```

Edits to existing models:
- `Tag`: add `tabSheetTags TabSheetTag[]`
- `Comment`: add `tabSheetId String?` + relation `tabSheet TabSheet? @relation("TabSheetComments", ...)` + `@@index([tabSheetId])`
- `ShareLink`: add a **nullable `tabSheetId`** (+ relation) alongside the existing
  `lyricSheetId`; make `lyricSheetId` nullable too and enforce exactly-one in code
  (decision #4). Avoids a `sheetType` enum refactor.
- `User`: add the back-relations (`TabSheet[]`, `TabSheetShare[]`) Prisma requires.

Migration: `npx prisma migrate dev --name add_tab_sheets`.

---

## 2. API routes

Copy the `lyric-sheets` route tree verbatim, swapping the model. Every handler
keeps the same `requireAuth()` → `getTabSheetWithAccess()` → permission-check shape.

```
src/app/api/tab-sheets/route.ts                         GET (list) / POST (create)
src/app/api/tab-sheets/[id]/route.ts                    GET / PATCH / DELETE
src/app/api/tab-sheets/[id]/autosave/route.ts           POST (debounced draft upsert)
src/app/api/tab-sheets/[id]/checkin/route.ts            POST (named version)
src/app/api/tab-sheets/[id]/versions/route.ts           GET
src/app/api/tab-sheets/[id]/versions/[versionId]/route.ts
src/app/api/tab-sheets/[id]/versions/[versionId]/revert/route.ts
src/app/api/tab-sheets/[id]/shares/route.ts             + [shareId]
src/app/api/tab-sheets/[id]/tags/route.ts               + [tagId]
src/app/api/tab-sheets/[id]/comments/route.ts           + [commentId]
src/app/api/tab-sheets/[id]/share-link/route.ts
src/app/api/tab-sheets/[id]/upload/route.ts             POST (Guitar Pro import)
```

Add to `src/lib/sheet-access.ts`:

```ts
export async function getTabSheetWithAccess(sheetId: string, userId: string) {
  const sheet = await prisma.tabSheet.findUnique({
    where: { id: sheetId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: true,
      tags: { include: { tag: true } },
    },
  })
  if (!sheet) return null
  const isOwner = sheet.ownerId === userId
  const isPublic = sheet.visibility === "PUBLIC"
  const share = sheet.shares.find((s) => s.userId === userId)
  if (!isOwner && !isPublic && !share) return null
  return { sheet, isOwner, share, permission: isOwner ? "EDITOR" : (share?.permission ?? "VIEWER") }
}
```

Autosave/check-in handlers are line-for-line copies of the lyric versions, except
`content` is `{ format: "alphatex", source }`. The autosave hook already posts
arbitrary `content`, so it works unchanged when pointed at the tab-sheets endpoint.

---

## 3. The editor component (the only genuinely new UI)

`src/components/tab-sheets/editor/tab-editor.tsx` — a **split pane**:
left = alphaTex source textarea, right = live-rendered alphaTab preview.
This mirrors `LyricSheetEditor`'s header (title, visibility, share, check-in,
history, delete) and its autosave wiring.

### alphaTab React integration

Install: `npm i @coderline/alphatab`

```tsx
"use client"
import { useEffect, useRef, useState } from "react"
import * as alphaTab from "@coderline/alphatab"
import { useAutosave } from "@/hooks/use-autosave"   // reused as-is (see note below)

// Accepts either authored alphaTex or an imported Guitar Pro file's bytes.
type TabSource =
  | { format: "alphatex"; source: string }
  | { format: "guitarpro"; bytes: Uint8Array }

export function TabPreview({ content }: { content: TabSource }) {
  const elRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<alphaTab.AlphaTabApi | null>(null)
  // both notations on by default (locked decision #1); toggle hides the tab staff
  const [showStandard, setShowStandard] = useState(true)

  // Init once
  useEffect(() => {
    if (!elRef.current) return
    const api = new alphaTab.AlphaTabApi(elRef.current, {
      core: { engine: "svg" },
      // render BOTH standard notation and tablature (decision #1)
      display: { staveProfile: "ScoreTab" },
      player: {
        enablePlayer: true,
        enableCursor: true,
        // CDN-only assets (decision #2)
        soundFont: "https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/soundfont/sonivox.sf2",
        // alphaTab also needs its Bravura font; point fontDirectory at the CDN too
      },
    })
    apiRef.current = api
    return () => api.destroy()
  }, [])

  // (Re)render whenever the content changes
  useEffect(() => {
    const api = apiRef.current
    if (!api) return
    if (content.format === "alphatex") api.tex(content.source)         // authored
    else api.load(content.bytes)                                        // GP import
  }, [content])

  // Toggle standard-notation staff on/off (decision #1)
  useEffect(() => {
    const api = apiRef.current
    if (!api) return
    api.settings.display.staveProfile = showStandard ? "ScoreTab" : "Tab"
    api.updateSettings()
    api.render()
  }, [showStandard])

  return (
    <div>
      <div className="flex gap-2">
        <button onClick={() => apiRef.current?.playPause()}>Play / Pause</button>
        <button onClick={() => setShowStandard((v) => !v)}>
          {showStandard ? "Tab only" : "Show notation"}
        </button>
      </div>
      <div ref={elRef} />
    </div>
  )
}
```

The editor holds `source` in state, debounce-renders it into `<TabPreview>`, and
feeds `{ format: "alphatex", source }` to `useAutosave` pointed at
`/api/tab-sheets/[id]/autosave`. For GP-imported sheets the preview is fed the
file bytes (fetched from `/api/files/[...key]`) and the source pane is hidden
(read-only render + playback in v1).

> **Note on the autosave hook:** today it hardcodes the `/api/lyric-sheets/...`
> URL. Generalize it to accept an `endpoint` (or `sheetType`) prop so both sheet
> types share it. One-line change, no behavior change for lyric sheets.

### SSR / bundling caveats
- alphaTab touches `window`/`Worker`; load the preview with
  `next/dynamic(() => import(...), { ssr: false })`.
- Host the SoundFont + (optional) web worker/font assets. Simplest: point at the
  jsDelivr CDN as above. For production polish, copy `dist/soundfont` and the
  Bravura font into `/public` and set `fontDirectory` / `soundFont` to local paths.

---

## 4. Comment anchoring (reuses the existing text scheme)

Because the source of truth is a text string, our lyric anchor strategy applies
directly. Store, in `Comment.anchor`:

```ts
{ type: "tab-text", from: number, to: number, text: "exact quoted alphaTex" }
```

Resolution order (same resilience logic as lyrics):
1. If `source.slice(from, to) === anchor.text` → highlight that selection in the
   source pane.
2. Else forward-search for `anchor.text` → re-anchor to the found offset.
3. Else show as "unanchored".

A v2 nicety: alphaTab beats expose bar/beat indices, so we *could* later map a
text selection to a musical position and highlight on the **rendered score** too.
Not required for the MVP — text-pane highlighting is enough and free.

**GP-imported sheets** have no editable text source, so they use a bar-style
anchor instead (like Music Sheets' page anchor):

```ts
{ type: "bar", bar: number }
```

The comment panel picks the anchor strategy from `content.format`:
`alphatex` → `tab-text`, `guitarpro` → `bar`.

---

## 5. Pages & navigation

```
src/app/(app)/tab-sheets/page.tsx            list (clone of lyric-sheets list:
                                             search, group-by tag/owner/visibility)
src/app/(app)/tab-sheets/new/page.tsx        create
src/app/(app)/tab-sheets/[id]/page.tsx       editor + comment panel
src/app/(app)/tab-sheets/[id]/history/page.tsx  version history + revert
```

- Add a **Tab Sheets** item to `src/components/layout/sidebar.tsx`
  (icon suggestion: `Guitar` from lucide-react).
- Extend `/share/[token]` to detect a tab-sheet link and render a read-only
  `<TabPreview>` instead of the TipTap viewer.

---

## 6. Notifications

No new types needed — reuse `NEW_COMMENT_ON_OWNED/SHARED/PUBLIC` and
`MENTIONED_IN_COMMENT`. The dispatch payload already carries a sheet id; add a
`tabSheetId` branch where the email/feed link is built
(`src/lib/email/index.ts` `sheetUrl`, and the feed item renderer).

---

## 7. Phased build order

1. **Schema + migration** — `TabSheet`, versions, shares, tags; patch `Comment`,
   `Tag`, `ShareLink`, `User`. Run migration.
2. **Access helper** — `getTabSheetWithAccess` in `sheet-access.ts`.
3. **API tree** — copy lyric-sheets routes, swap model. Generalize `useAutosave`
   to take an endpoint.
4. **Preview component** — `TabPreview` with dynamic import + CDN soundfont,
   rendering **both** notation + tab (decision #1). Validate alphaTex renders and
   plays in isolation first.
   - **4b. Guitar Pro import** (decision #3) — `upload/route.ts` storing the file
     via `StorageProvider`; preview branch that fetches bytes and calls
     `api.load(bytes)`.
5. **Editor** — split pane (source textarea + live preview), wire title/visibility/
   check-in/history/delete header from the lyric editor. GP-imported sheets render
   read-only (no source pane) in v1.
6. **Pages + sidebar** — list, new, [id], history; add nav item. Create page offers
   both "Start from scratch (alphaTex)" and "Import Guitar Pro file".
7. **Comments** — drop in the existing comment panel; add `tab-text` anchor
   resolution for alphaTex sheets and `bar` anchor for GP-imported sheets.
8. **Sharing + public link** — share dialog (clone), extend `/share/[token]` to
   render `<TabPreview>` (nullable `tabSheetId` on `ShareLink`, decision #4).
9. **Notifications** — add the `tabSheetId` link branch.
10. **Polish** — empty/loading states, mobile (stack panes vertically). Soundfont/
    fonts stay on CDN for now (decision #2; self-hosting is a later drop-in).

### Effort estimate
- Steps 1–3 (schema + API): mostly mechanical copies — ~half a day.
- Steps 4–5 (the real new work, alphaTab editor + GP import): ~2 days to a solid MVP.
- Steps 6–9: reuse-heavy — ~1 day.
- **MVP total: roughly 3.5–4 focused days.**

---

## 8. Locked decisions (2026-06-04)

1. **Notation scope: tablature + standard notation.** Show both views via an
   alphaTab render toggle. alphaTab produces both from the same source, so this is
   a UI toggle, not extra parsing work.
2. **Playback assets: CDN only.** Point `soundFont` (and font assets) at the
   jsDelivr CDN. Accepts a runtime external dependency in exchange for zero asset
   setup. (If we ever want to remove the dependency, self-hosting into `/public` is
   a drop-in change — set local `soundFont`/`fontDirectory` paths.)
3. **Guitar Pro import: included in v1.** Support uploading `.gp3/4/5/gpx` and
   rendering via `api.load(bytes)`. See §9 step 4b and the new upload route below.
4. **`ShareLink` shape: nullable `tabSheetId` column.** Add an optional
   `tabSheetId` alongside the existing `lyricSheetId`; enforce exactly-one in code.
   Smallest migration, no disruption to existing share links.

### Implications of the GP-import decision

The data model stays text-first, but a Tab Sheet's `content` can originate two ways:
- **Authored**: `{ format: "alphatex", source: "<alphaTex>" }`
- **Imported**: user uploads a Guitar Pro file. We store the original file via the
  existing `StorageProvider` (like Music Sheets) and record
  `{ format: "guitarpro", fileKey: "<storage key>" }` in `content`.

So `TabSheet.content` is a small tagged union:

```ts
type TabContent =
  | { format: "alphatex"; source: string }
  | { format: "guitarpro"; fileKey: string }
```

Rendering:
- `alphatex` → `api.tex(source)`
- `guitarpro` → fetch the file bytes (via `/api/files/[...key]`) → `api.load(bytes)`

Editing note: alphaTex sheets are fully editable in the split-pane editor and get
text-based comment anchoring. GP-imported sheets are **render + comment(by page/bar)
+ playback** in v1; converting GP→alphaTex for full text editing is a v2
consideration. For imported sheets, fall back to a page/bar-style anchor like
Music Sheets (`{ type: "bar", bar: N }`) rather than `tab-text`.

New API route for import:
```
src/app/api/tab-sheets/[id]/upload/route.ts   POST — accept GP file,
  store via StorageProvider, set content = { format: "guitarpro", fileKey }
```
This mirrors the Music Sheets upload flow (presigned S3 in prod, local FS in dev).
