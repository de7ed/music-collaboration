"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Plus, Music, MessageSquare, X, Globe, Lock, Trash2, Tag as TagIcon, Users, LogOut } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatDistanceToNow, formatBytes } from "@/lib/utils"
import { ShareDialog } from "@/components/lyric-sheets/sharing/share-dialog"

type Tag = { id: string; name: string }
type User = { id: string; name: string | null; email: string }

type Sheet = {
  id: string
  title: string
  visibility: "PRIVATE" | "SHARED" | "PUBLIC"
  mimeType: string
  sizeBytes: number
  createdAt: string
  updatedAt: string
  owner: { id: string; name: string | null; email: string }
  tags: Array<{ tag: Tag }>
  shares: Array<{ id: string }>
  lyricSheet: { id: string; title: string } | null
  _count: { comments: number }
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
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.top + r.height / 2, right: window.innerWidth - r.left + 8 })
    }
    setOpen((o) => !o)
  }

  useEffect(() => {
    function handle(e: MouseEvent) {
      const target = e.target as Node
      if (!btnRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const existingIds = new Set(sheetTags.map((t) => t.id))
  const trimmed = query.trim().toLowerCase()
  const filtered = availableTags.filter(
    (t) => !existingIds.has(t.id) && t.name.includes(trimmed)
  )
  const canCreate = !!trimmed && !availableTags.some((t) => t.name === trimmed) && !existingIds.has(trimmed)

  async function addTag(name: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/music-sheets/${sheetId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        onAdd(await res.json())
        setQuery("")
        setOpen(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const emptyMessage = () => {
    if (trimmed) return "No tags match — press Add to create"
    if (availableTags.length > 0 && availableTags.every((t) => existingIds.has(t.id))) return "All tags already applied"
    return "Type to search or create a tag"
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded hover:border-gray-400 hover:text-gray-600 transition-colors"
        title="Add tag"
      >
        <TagIcon className="w-3 h-3" />
        <Plus className="w-2.5 h-2.5" />
      </button>
      {open && (
        <div
          ref={popoverRef}
          style={{ position: "fixed", top: pos.top, right: pos.right, transform: "translateY(-50%)", zIndex: 9999 }}
          className="w-52 bg-white border border-gray-200 rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-1.5 border-b border-gray-100 flex gap-1">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (canCreate) addTag(trimmed)
                  else if (filtered.length === 1) addTag(filtered[0].name)
                }
                if (e.key === "Escape") setOpen(false)
              }}
              placeholder={canCreate ? `↵ to add "${trimmed}"` : "Search or type new tag…"}
              className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded outline-none focus:border-gray-400"
            />
            {canCreate && (
              <button onClick={() => addTag(trimmed)} disabled={loading}
                className="px-2 py-1 text-xs bg-black text-white rounded hover:bg-gray-700 disabled:opacity-50 shrink-0">
                Add
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto py-1">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => addTag(t.name)} disabled={loading}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50">
                {t.name}
              </button>
            ))}
            {filtered.length === 0 && !canCreate && (
              <p className="px-3 py-2 text-xs text-gray-400">{emptyMessage()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sheet Row ────────────────────────────────────────────────────────────────

function SheetRow({
  sheet, currentUserId, allUsers, availableTags, onUpdate, onDelete,
}: {
  sheet: Sheet; currentUserId: string; allUsers: User[]; availableTags: Tag[]
  onUpdate: (id: string, patch: Partial<Sheet>) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const isOwner = sheet.owner.id === currentUserId
  const isPublic = sheet.visibility === "PUBLIC"
  const isSharedWithMe = !isOwner && sheet.shares.length > 0

  async function leaveSheet(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Remove yourself from "${sheet.title}"? You'll lose access unless it's public.`)) return
    const res = await fetch(`/api/music-sheets/${sheet.id}/leave`, { method: "DELETE" })
    if (res.ok) onDelete(sheet.id)
  }

  const [shareOpen, setShareOpen] = useState(false)
  const [shareData, setShareData] = useState<{ id: string; userId: string; permission: string }[] | null>(null)

  async function openShareUsers(e: React.MouseEvent) {
    e.stopPropagation()
    if (!shareData) {
      const res = await fetch(`/api/music-sheets/${sheet.id}/shares`)
      if (res.ok) setShareData(await res.json())
    }
    setShareOpen(true)
  }

  async function toggleVisibility(e: React.MouseEvent) {
    e.stopPropagation()
    const next = isPublic ? "PRIVATE" : "PUBLIC"
    const res = await fetch(`/api/music-sheets/${sheet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: next }),
    })
    if (res.ok) onUpdate(sheet.id, { visibility: next })
  }

  async function deleteSheet(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete "${sheet.title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/music-sheets/${sheet.id}`, { method: "DELETE" })
    if (res.ok) onDelete(sheet.id)
  }

  function removeTag(tagId: string) {
    fetch(`/api/music-sheets/${sheet.id}/tags/${tagId}`, { method: "DELETE" })
    onUpdate(sheet.id, { tags: sheet.tags.filter((t) => t.tag.id !== tagId) })
  }

  function addTag(tag: Tag) {
    if (!sheet.tags.some((t) => t.tag.id === tag.id)) {
      onUpdate(sheet.id, { tags: [...sheet.tags, { tag }] })
    }
  }

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group cursor-pointer"
        onClick={() => router.push(`/music-sheets/${sheet.id}`)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Music className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate group-hover:underline">{sheet.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {sheet.owner.id === currentUserId ? "You" : (sheet.owner.name ?? sheet.owner.email)}
              {" · "}{formatBytes(sheet.sizeBytes)}
              {" · "}{formatDistanceToNow(new Date(sheet.updatedAt))}
              {sheet.lyricSheet && ` · linked to "${sheet.lyricSheet.title}"`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
          {/* Tags */}
          {sheet.tags.map(({ tag }) => (
            <span key={tag.id} className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">
              {tag.name}
              {isOwner && (
                <button onClick={() => removeTag(tag.id)} className="ml-0.5 text-gray-400 hover:text-gray-700 transition-colors" title="Remove tag">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          ))}
          {isOwner && (
            <TagAddPopover sheetId={sheet.id} sheetTags={sheet.tags.map((t) => t.tag)} availableTags={availableTags} onAdd={addTag} />
          )}

          <div className="w-px h-4 bg-gray-200 mx-0.5" />

          {/* Visibility toggle */}
          {isOwner ? (
            <button onClick={toggleVisibility}
              title={isPublic ? "Public — click to make private" : "Private — click to make public"}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border transition-colors ${isPublic ? "bg-black text-white border-black hover:bg-gray-700" : "bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPublic ? "Public" : "Private"}
            </button>
          ) : (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border ${isPublic ? "bg-black text-white border-black" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPublic ? "Public" : "Private"}
            </span>
          )}

          {/* Comments */}
          {sheet._count.comments > 0 && (
            <button onClick={(e) => { e.stopPropagation(); router.push(`/music-sheets/${sheet.id}`) }}
              title="View comments"
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 rounded border border-transparent hover:border-gray-200 hover:bg-gray-100 transition-colors">
              <MessageSquare className="w-3 h-3" />
              {sheet._count.comments}
            </button>
          )}

          {/* Owner-only actions */}
          {isOwner && (
            <>
              <button onClick={openShareUsers} title="Share with users"
                className="p-1 rounded text-gray-400 border border-transparent hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <Users className="w-3.5 h-3.5" />
              </button>
              <button onClick={deleteSheet} title="Delete sheet"
                className="p-1 rounded text-gray-400 border border-transparent hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Leave option for explicitly shared-with-me sheets */}
          {isSharedWithMe && (
            <button onClick={leaveSheet} title="Remove myself from this sheet"
              className="p-1 rounded text-gray-400 border border-transparent hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {shareOpen && shareData !== null && (
        <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)}
          sheetId={sheet.id} sheetType="music"
          allUsers={allUsers.filter((u) => u.id !== currentUserId)}
          currentShares={shareData} />
      )}
    </>
  )
}

// ── Grouped list ──────────────────────────────────────────────────────────────

function GroupedList({
  groups,
  currentUserId,
  allUsers,
  availableTags,
  onUpdate,
  onDelete,
}: {
  groups: Array<{ label: string; sheets: Sheet[] }>
  currentUserId: string
  allUsers: User[]
  availableTags: Tag[]
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
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg [&>*:first-child]:rounded-t-lg [&>*:last-child]:rounded-b-lg">
            {sheets.map((sheet) => (
              <SheetRow
                key={sheet.id}
                sheet={sheet}
                currentUserId={currentUserId}
                allUsers={allUsers}
                availableTags={availableTags}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
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
    sheets.forEach((s) => {
      map[s.visibility === "PUBLIC" ? "Public" : "Private"].push(s)
    })
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
    return Array.from(map.values()).sort((a, b) =>
      a.label === "You" ? -1 : b.label === "You" ? 1 : a.label.localeCompare(b.label)
    )
  }

  if (groupBy === "tag") {
    const map = new Map<string, Sheet[]>()
    const untagged: Sheet[] = []
    sheets.forEach((s) => {
      if (s.tags.length === 0) {
        untagged.push(s)
      } else {
        s.tags.forEach(({ tag }) => {
          if (!map.has(tag.name)) map.set(tag.name, [])
          map.get(tag.name)!.push(s)
        })
      }
    })
    const groups = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, sheets]) => ({ label, sheets }))
    if (untagged.length > 0) groups.push({ label: "Untagged", sheets: untagged })
    return groups
  }

  return []
}

// ── Main list component ───────────────────────────────────────────────────────

export function MusicSheetList({
  initialSheets,
  currentUserId,
  availableTags,
  allUsers,
}: {
  initialSheets: Sheet[]
  currentUserId: string
  availableTags: Tag[]
  allUsers: User[]
}) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { router.refresh() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const [sheets, setSheets] = useState(initialSheets)

  // Sync state when server re-renders with fresh data (e.g. after router.refresh())
  useEffect(() => { setSheets(initialSheets) }, [initialSheets])
  useEffect(() => { setLocalTags(availableTags) }, [availableTags])
  const [search, setSearch] = useState("")
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "mine" | "shared">("all")
  const [visibilityFilter, setVisibilityFilter] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [groupBy, setGroupBy] = useState<GroupBy>("none")
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

  const filtered = useMemo(() => {
    return sheets.filter((s) => {
      if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
      if (ownershipFilter === "mine" && s.owner.id !== currentUserId) return false
      if (ownershipFilter === "shared" && s.owner.id === currentUserId) return false
      if (visibilityFilter && s.visibility !== visibilityFilter) return false
      if (tagFilter && !s.tags.some((t) => t.tag.name === tagFilter)) return false
      return true
    })
  }, [sheets, search, ownershipFilter, visibilityFilter, tagFilter, currentUserId])

  const groups = useMemo(
    () => groupBy !== "none" ? groupSheets(filtered, groupBy, currentUserId) : [],
    [filtered, groupBy, currentUserId]
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Music Sheets</h1>
        <Link href="/music-sheets/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="w-4 h-4 mr-1" />
          Upload
        </Link>
      </div>

      {/* Filters + Group by */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 h-8 text-sm"
        />

        <div className="flex gap-1">
          {(["all", "mine", "shared"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOwnershipFilter(o)}
              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                ownershipFilter === o
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {o === "all" ? "All" : o === "mine" ? "Mine" : "Shared"}
            </button>
          ))}
        </div>

        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white"
        >
          <option value="">All visibility</option>
          <option value="PRIVATE">Private</option>
          <option value="PUBLIC">Public</option>
        </select>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white"
          disabled={localTags.length === 0}
        >
          <option value="">{localTags.length === 0 ? "No tags yet" : "All tags"}</option>
          {localTags.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-gray-200" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Group by</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white"
          >
            <option value="none">None</option>
            <option value="visibility">Visibility</option>
            <option value="owner">Owner</option>
            <option value="tag">Tag</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No music sheets found</p>
        </div>
      ) : groupBy !== "none" ? (
        <GroupedList
          groups={groups}
          currentUserId={currentUserId}
          allUsers={allUsers}
          availableTags={localTags}
          onUpdate={updateSheet}
          onDelete={deleteSheet}
        />
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {filtered.map((sheet) => (
            <SheetRow
              key={sheet.id}
              sheet={sheet}
              currentUserId={currentUserId}
              allUsers={allUsers}
              availableTags={localTags}
              onUpdate={updateSheet}
              onDelete={deleteSheet}
            />
          ))}
        </div>
      )}
    </div>
  )
}
