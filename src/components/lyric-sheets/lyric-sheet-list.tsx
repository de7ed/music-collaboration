"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileText, MessageSquare, MoreHorizontal, X, Globe, Lock, Share2, Trash2, Tag as TagIcon, Link2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "@/lib/utils"
import { ShareDialog } from "@/components/lyric-sheets/sharing/share-dialog"
import { ShareLinkModal } from "@/components/lyric-sheets/sharing/share-link-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Tag = { id: string; name: string }
type User = { id: string; name: string | null; email: string }

type Sheet = {
  id: string
  title: string
  visibility: "PRIVATE" | "SHARED" | "PUBLIC"
  createdAt: string
  updatedAt: string
  owner: { id: string; name: string | null; email: string }
  tags: Array<{ tag: Tag }>
  _count: { comments: number }
  content?: unknown
}

type GroupBy = "none" | "visibility" | "owner" | "tag"

// ── Tag Popover ──────────────────────────────────────────────────────────────

function TagAddPopover({
  sheetId,
  sheetTags,
  availableTags,
  onAdd,
}: {
  sheetId: string
  sheetTags: Tag[]
  availableTags: Tag[]
  onAdd: (tag: Tag) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const existingIds = new Set(sheetTags.map((t) => t.id))
  const filtered = availableTags.filter(
    (t) => !existingIds.has(t.id) && t.name.includes(query.toLowerCase().trim())
  )
  const trimmed = query.trim().toLowerCase()
  const canCreate = trimmed && !availableTags.some((t) => t.name === trimmed) && !existingIds.has(trimmed)

  async function addTag(name: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/lyric-sheets/${sheetId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const tag = await res.json()
        onAdd(tag)
        setQuery("")
        setOpen(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded hover:border-gray-400 hover:text-gray-600 transition-colors"
        title="Add tag"
      >
        <TagIcon className="w-3 h-3" />
        <Plus className="w-2.5 h-2.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="p-1.5 border-b border-gray-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) addTag(trimmed)
                if (e.key === "Escape") setOpen(false)
              }}
              placeholder="Find or create tag..."
              className="w-full text-xs px-2 py-1 border border-gray-200 rounded outline-none focus:border-gray-400"
            />
          </div>
          <div className="max-h-40 overflow-y-auto py-1">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => addTag(t.name)}
                disabled={loading}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
              >
                {t.name}
              </button>
            ))}
            {canCreate && (
              <button
                onClick={() => addTag(trimmed)}
                disabled={loading}
                className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                Create &ldquo;{trimmed}&rdquo;
              </button>
            )}
            {filtered.length === 0 && !canCreate && (
              <p className="px-3 py-2 text-xs text-gray-400">No tags found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sheet Row ────────────────────────────────────────────────────────────────

function SheetRow({
  sheet,
  currentUserId,
  allUsers,
  availableTags,
  onUpdate,
  onDelete,
}: {
  sheet: Sheet
  currentUserId: string
  allUsers: User[]
  availableTags: Tag[]
  onUpdate: (id: string, patch: Partial<Sheet>) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const isOwner = sheet.owner.id === currentUserId

  const [shareOpen, setShareOpen] = useState(false)
  const [shareData, setShareData] = useState<{ id: string; userId: string; permission: string }[] | null>(null)
  const [shareLinkOpen, setShareLinkOpen] = useState(false)

  async function openShareUsers(e: React.MouseEvent) {
    e.stopPropagation()
    if (!shareData) {
      const res = await fetch(`/api/lyric-sheets/${sheet.id}/shares`)
      if (res.ok) setShareData(await res.json())
    }
    setShareOpen(true)
  }

  async function toggleVisibility(e: React.MouseEvent) {
    e.stopPropagation()
    const next = sheet.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"
    const res = await fetch(`/api/lyric-sheets/${sheet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: next }),
    })
    if (res.ok) onUpdate(sheet.id, { visibility: next })
  }

  async function deleteSheet(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete "${sheet.title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/lyric-sheets/${sheet.id}`, { method: "DELETE" })
    if (res.ok) onDelete(sheet.id)
  }

  function removeTag(tagId: string) {
    fetch(`/api/lyric-sheets/${sheet.id}/tags/${tagId}`, { method: "DELETE" })
    onUpdate(sheet.id, { tags: sheet.tags.filter((t) => t.tag.id !== tagId) })
  }

  function addTag(tag: Tag) {
    if (!sheet.tags.some((t) => t.tag.id === tag.id)) {
      onUpdate(sheet.id, { tags: [...sheet.tags, { tag }] })
    }
  }

  const isPublic = sheet.visibility === "PUBLIC"

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group cursor-pointer"
        onClick={() => router.push(`/lyric-sheets/${sheet.id}`)}
      >
        {/* Left: icon + title + meta */}
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate group-hover:underline">{sheet.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {sheet.owner.id === currentUserId ? "You" : (sheet.owner.name ?? sheet.owner.email)}
              {" · "}{formatDistanceToNow(new Date(sheet.updatedAt))}
            </p>
          </div>
        </div>

        {/* Right: tags + action chips */}
        <div className="flex items-center gap-1.5 shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
          {/* Tags */}
          {sheet.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200"
            >
              {tag.name}
              {isOwner && (
                <button
                  onClick={() => removeTag(tag.id)}
                  className="ml-0.5 text-gray-400 hover:text-gray-700 transition-colors"
                  title="Remove tag"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          ))}
          {isOwner && (
            <TagAddPopover
              sheetId={sheet.id}
              sheetTags={sheet.tags.map((t) => t.tag)}
              availableTags={availableTags}
              onAdd={addTag}
            />
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {/* Visibility toggle */}
          {isOwner ? (
            <button
              onClick={toggleVisibility}
              title={isPublic ? "Public — click to make private" : "Private — click to make public"}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border transition-colors ${
                isPublic
                  ? "bg-black text-white border-black hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPublic ? "Public" : "Private"}
            </button>
          ) : (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border ${
              isPublic ? "bg-black text-white border-black" : "bg-gray-100 text-gray-600 border-gray-200"
            }`}>
              {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPublic ? "Public" : "Private"}
            </span>
          )}

          {/* Comments */}
          {sheet._count.comments > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/lyric-sheets/${sheet.id}`) }}
              title="View comments"
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 rounded border border-transparent hover:border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              {sheet._count.comments}
            </button>
          )}

          {/* Owner-only actions */}
          {isOwner && (
            <>
              {/* Share link */}
              <button
                onClick={(e) => { e.stopPropagation(); setShareLinkOpen(true) }}
                title="Share link"
                className="p-1 rounded text-gray-400 border border-transparent hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>

              {/* Share with users */}
              <button
                onClick={openShareUsers}
                title="Share with users"
                className="p-1 rounded text-gray-400 border border-transparent hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                onClick={deleteSheet}
                title="Delete sheet"
                className="p-1 rounded text-gray-400 border border-transparent hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Overflow menu (kept for discoverability) */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                  title="More"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={toggleVisibility}>
                    {isPublic ? <><Lock className="w-3.5 h-3.5" /> Make private</> : <><Globe className="w-3.5 h-3.5" /> Make public</>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShareLinkOpen(true) }}>
                    <Link2 className="w-3.5 h-3.5" /> Share link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openShareUsers}>
                    <Share2 className="w-3.5 h-3.5" /> Share with users
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={deleteSheet}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {shareLinkOpen && (
        <ShareLinkModal
          open={shareLinkOpen}
          onClose={() => setShareLinkOpen(false)}
          sheetId={sheet.id}
        />
      )}
      {shareOpen && shareData !== null && (
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          sheetId={sheet.id}
          sheetType="lyric"
          allUsers={allUsers.filter((u) => u.id !== currentUserId)}
          currentShares={shareData}
        />
      )}
    </>
  )
}

// ── Grouped list ──────────────────────────────────────────────────────────────

function GroupedList({
  groups, currentUserId, allUsers, availableTags, onUpdate, onDelete,
}: {
  groups: Array<{ label: string; sheets: Sheet[] }>
  currentUserId: string; allUsers: User[]; availableTags: Tag[]
  onUpdate: (id: string, patch: Partial<Sheet>) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-5">
      {groups.map(({ label, sheets }) => (
        <div key={label}>
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</h3>
            <span className="text-xs text-gray-300">{sheets.length}</span>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {sheets.map((sheet) => (
              <SheetRow key={sheet.id} sheet={sheet} currentUserId={currentUserId}
                allUsers={allUsers} availableTags={availableTags}
                onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Grouping logic ────────────────────────────────────────────────────────────

function groupSheets(sheets: Sheet[], groupBy: GroupBy, currentUserId: string): Array<{ label: string; sheets: Sheet[] }> {
  if (groupBy === "visibility") {
    const map: Record<string, Sheet[]> = { Public: [], Private: [] }
    sheets.forEach((s) => { map[s.visibility === "PUBLIC" ? "Public" : "Private"].push(s) })
    return Object.entries(map).filter(([, v]) => v.length > 0).map(([label, sheets]) => ({ label, sheets }))
  }
  if (groupBy === "owner") {
    const map = new Map<string, { label: string; sheets: Sheet[] }>()
    sheets.forEach((s) => {
      const key = s.owner.id
      const label = s.owner.id === currentUserId ? "You" : (s.owner.name ?? s.owner.email)
      if (!map.has(key)) map.set(key, { label, sheets: [] })
      map.get(key)!.sheets.push(s)
    })
    return Array.from(map.values()).sort((a, b) => a.label === "You" ? -1 : b.label === "You" ? 1 : a.label.localeCompare(b.label))
  }
  if (groupBy === "tag") {
    const map = new Map<string, Sheet[]>()
    const untagged: Sheet[] = []
    sheets.forEach((s) => {
      if (s.tags.length === 0) { untagged.push(s) }
      else { s.tags.forEach(({ tag }) => { if (!map.has(tag.name)) map.set(tag.name, []); map.get(tag.name)!.push(s) }) }
    })
    const groups = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, sheets]) => ({ label, sheets }))
    if (untagged.length > 0) groups.push({ label: "Untagged", sheets: untagged })
    return groups
  }
  return []
}

// ── Main list ─────────────────────────────────────────────────────────────────

export function LyricSheetList({
  initialSheets, currentUserId, availableTags, allUsers,
}: {
  initialSheets: Sheet[]; currentUserId: string; availableTags: Tag[]; allUsers: User[]
}) {
  const router = useRouter()
  const [sheets, setSheets] = useState(initialSheets)
  const [search, setSearch] = useState("")
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "mine" | "shared">("all")
  const [visibilityFilter, setVisibilityFilter] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [groupBy, setGroupBy] = useState<GroupBy>("none")
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [localTags, setLocalTags] = useState(availableTags)

  const updateSheet = useCallback((id: string, patch: Partial<Sheet>) => {
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    if (patch.tags) {
      patch.tags.forEach(({ tag }) => {
        setLocalTags((prev) => prev.some((t) => t.id === tag.id) ? prev : [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      })
    }
  }, [])

  const deleteSheet = useCallback((id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const filtered = useMemo(() => sheets.filter((s) => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    if (ownershipFilter === "mine" && s.owner.id !== currentUserId) return false
    if (ownershipFilter === "shared" && s.owner.id === currentUserId) return false
    if (visibilityFilter && s.visibility !== visibilityFilter) return false
    if (tagFilter && !s.tags.some((t) => t.tag.name === tagFilter)) return false
    return true
  }), [sheets, search, ownershipFilter, visibilityFilter, tagFilter, currentUserId])

  const groups = useMemo(
    () => groupBy !== "none" ? groupSheets(filtered, groupBy, currentUserId) : [],
    [filtered, groupBy, currentUserId]
  )

  async function createSheet() {
    if (!newTitle.trim()) return
    const res = await fetch("/api/lyric-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    })
    if (res.ok) router.push(`/lyric-sheets/${(await res.json()).id}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lyric Sheets</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-1" /> New sheet
        </Button>
      </div>

      {creating && (
        <div className="flex gap-2 items-center border border-gray-200 rounded-lg p-3 bg-gray-50">
          <Input autoFocus placeholder="Sheet title..." value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createSheet(); if (e.key === "Escape") setCreating(false) }}
            className="flex-1" />
          <Button size="sm" onClick={createSheet} disabled={!newTitle.trim()}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 h-8 text-sm" />
        <div className="flex gap-1">
          {(["all", "mine", "shared"] as const).map((o) => (
            <button key={o} onClick={() => setOwnershipFilter(o)}
              className={`px-3 py-1 text-xs rounded-md border transition-colors ${ownershipFilter === o ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {o === "all" ? "All" : o === "mine" ? "Mine" : "Shared with me"}
            </button>
          ))}
        </div>
        <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}
          className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white">
          <option value="">All visibility</option>
          <option value="PRIVATE">Private</option>
          <option value="PUBLIC">Public</option>
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}
          className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white" disabled={localTags.length === 0}>
          <option value="">{localTags.length === 0 ? "No tags yet" : "All tags"}</option>
          {localTags.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Group by</span>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white">
            <option value="none">None</option>
            <option value="visibility">Visibility</option>
            <option value="owner">Owner</option>
            <option value="tag">Tag</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No lyric sheets found</p>
        </div>
      ) : groupBy !== "none" ? (
        <GroupedList groups={groups} currentUserId={currentUserId} allUsers={allUsers}
          availableTags={localTags} onUpdate={updateSheet} onDelete={deleteSheet} />
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {filtered.map((sheet) => (
            <SheetRow key={sheet.id} sheet={sheet} currentUserId={currentUserId}
              allUsers={allUsers} availableTags={localTags}
              onUpdate={updateSheet} onDelete={deleteSheet} />
          ))}
        </div>
      )}
    </div>
  )
}
