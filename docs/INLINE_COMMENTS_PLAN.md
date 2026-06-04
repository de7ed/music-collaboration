# Inline Comments Feature Plan

## Branch Strategy

- **Work on:** `feature/inline-comments` (branch from `main`)
- **Merge into:** `release/0.1` when complete (do NOT merge to `main` directly)
- **Other branches in flight:** `feature/tab-sheets` (separate session), `feature/list-view-management` (done, already in `release/0.1`)

## What This Feature Does

Extends the comment system to support **line/section-level anchored comments** on lyric sheets, in addition to the existing song-level comments.

### User-facing behaviour
1. In the lyric sheet editor/viewer, the user selects a range of text
2. A floating "Comment" button appears near the selection
3. Clicking it opens the comment composer pre-loaded with the text anchor
4. The comment is saved with `anchor: { type: "text", from: N, to: N, text: "exact quoted text" }`
5. In the editor, anchored comments render as **highlighted text ranges** — the highlight color/style indicates a comment exists there
6. Clicking a highlight scrolls to and focuses that comment in the comment panel
7. Song-level (unanchored) comments continue to work exactly as before, shown at the top of the comment panel
8. Anchored comments are visually grouped/distinguished below (e.g. show the quoted text above the comment body)

### Stale anchor handling (already designed in CLAUDE.md)
- On render: if `anchor.from/to` still match → highlight there
- If text moved: fall back to forward-search for `anchor.text`
- If not found at all: show comment as "unanchored" (still visible, just not highlighted)

### Music sheets (simpler)
- Page-level anchors: `{ type: "page", page: N }`
- Clicking a page area sets the anchor; renders as a page-level indicator
- Already defined in the schema, just needs UI wiring

## Key Existing Infrastructure (Already Built)

The anchor system is **already wired end-to-end** in data model and API — it just needs UI activation.

### Schema
```prisma
model Comment {
  anchor    Json?   // already exists
  ...
}
```

### API
- `POST /api/lyric-sheets/[id]/comments` — already accepts `anchor` in body
- `POST /api/music-sheets/[id]/comments` — same
- No schema or API changes needed

### Comment types (from codebase)
```typescript
// Lyric sheet anchor
{ type: "text", from: number, to: number, text: string }

// Music sheet anchor  
{ type: "page", page: number }
```

## Key Files to Read Before Starting

```
src/components/comments/comment-panel.tsx       # Main comment container
src/components/comments/comment-thread.tsx      # Thread/reply rendering
src/components/comments/comment-composer.tsx    # Input with @mentions
src/app/(app)/lyric-sheets/[id]/page.tsx        # Lyric sheet detail page
src/app/(app)/music-sheets/[id]/page.tsx        # Music sheet detail page
```

The lyric sheet detail page uses TipTap as the editor. The comment panel sits in a 380px sidebar alongside the editor. Both are in the same page layout.

## Implementation Approach

### 1. Text selection → floating trigger (lyric sheets)
- Listen for `selectionchange` or TipTap's `onSelectionUpdate`
- When selection is non-empty, show a small floating "Add comment" button near the selection (use `getBoundingClientRect()` on the selection for positioning)
- On click: capture `{ type: "text", from: editor.state.selection.from, to: editor.state.selection.to, text: editor.state.doc.textBetween(from, to) }`
- Pass the anchor to the CommentComposer (add an optional `initialAnchor` prop)

### 2. Highlight decoration (lyric sheets)
- After comments load, use TipTap's `Decoration` API (via a custom extension or `DecorationSet`) to apply highlight marks at each anchor's `from`/`to` range
- On click of a highlight: scroll the comment panel to the relevant comment (add a `focusCommentId` state, pass it down)
- For stale anchors: try `doc.textBetween` forward-search for `anchor.text` before giving up

### 3. Comment panel UI changes
- Split panel into two sections:
  - **Song comments** (no anchor) — same as current, at top
  - **Section comments** (has anchor) — grouped below, each showing the quoted text snippet above the comment body
- Add a visual indicator on anchored comment threads (e.g. a quote bar on the left, the snippet text in gray)

### 4. Music sheet page anchors
- On PDF page click: set `anchor = { type: "page", page: N }`
- Show a small "commenting on page N" indicator in the composer
- Render anchored comments with a page badge

## Things to NOT Break
- Existing song-level comments (no anchor) must continue to work unchanged
- The `@mention` autocomplete in CommentComposer must still work
- SSE real-time notification dispatch must still fire for anchored comments
- The `CommentMention` tracking must still work

## Notes
- Don't add drag handles or complex position tracking — keep it simple
- The floating "Add comment" button should dismiss if the user clicks away or the selection collapses
- Anchored comments that fail stale-check should still be readable (show in panel, just not highlighted in editor)
- This feature should work on both the owner's edit view AND shared/public view
