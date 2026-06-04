"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Plus, FileText, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "@/lib/utils"
import { useRouter } from "next/navigation"

type Tag = { id: string; name: string }

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

const visibilityBadge = {
  PRIVATE: { label: "Private", className: "bg-gray-100 text-gray-600 border-gray-200" },
  SHARED:  { label: "Private", className: "bg-gray-100 text-gray-600 border-gray-200" },
  PUBLIC:  { label: "Public",  className: "bg-black text-white border-black" },
}

function SheetRow({ sheet, currentUserId }: { sheet: Sheet; currentUserId: string }) {
  const vb = visibilityBadge[sheet.visibility]
  return (
    <Link
      href={`/lyric-sheets/${sheet.id}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
    >
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
      <div className="flex items-center gap-2 shrink-0 ml-4">
        {sheet.tags.map(({ tag }) => (
          <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
        ))}
        <Badge variant="outline" className={`text-xs ${vb.className}`}>{vb.label}</Badge>
        {sheet._count.comments > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MessageSquare className="w-3 h-3" />
            {sheet._count.comments}
          </span>
        )}
      </div>
    </Link>
  )
}

function GroupedList({ groups, currentUserId }: { groups: Array<{ label: string; sheets: Sheet[] }>; currentUserId: string }) {
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
              <SheetRow key={sheet.id} sheet={sheet} currentUserId={currentUserId} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupSheets(sheets: Sheet[], groupBy: GroupBy, currentUserId: string): Array<{ label: string; sheets: Sheet[] }> {
  if (groupBy === "visibility") {
    const map: Record<string, Sheet[]> = { Public: [], Private: [] }
    sheets.forEach((s) => {
      const key = s.visibility === "PUBLIC" ? "Public" : "Private"
      map[key].push(s)
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
    // "You" first, then alphabetical
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

export function LyricSheetList({
  initialSheets,
  currentUserId,
  availableTags,
}: {
  initialSheets: Sheet[]
  currentUserId: string
  availableTags: Tag[]
}) {
  const router = useRouter()
  const [sheets] = useState(initialSheets)
  const [search, setSearch] = useState("")
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "mine" | "shared">("all")
  const [visibilityFilter, setVisibilityFilter] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [groupBy, setGroupBy] = useState<GroupBy>("none")
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")

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

  async function createSheet() {
    if (!newTitle.trim()) return
    const res = await fetch("/api/lyric-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    })
    if (res.ok) {
      const sheet = await res.json()
      router.push(`/lyric-sheets/${sheet.id}`)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lyric Sheets</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New sheet
        </Button>
      </div>

      {/* New sheet inline form */}
      {creating && (
        <div className="flex gap-2 items-center border border-gray-200 rounded-lg p-3 bg-gray-50">
          <Input
            autoFocus
            placeholder="Sheet title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createSheet()
              if (e.key === "Escape") setCreating(false)
            }}
            className="flex-1"
          />
          <Button size="sm" onClick={createSheet} disabled={!newTitle.trim()}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
        </div>
      )}

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
              {o === "all" ? "All" : o === "mine" ? "Mine" : "Shared with me"}
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
          disabled={availableTags.length === 0}
        >
          <option value="">{availableTags.length === 0 ? "No tags yet" : "All tags"}</option>
          {availableTags.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>

        {/* Divider */}
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

      {/* Sheet list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No lyric sheets found</p>
        </div>
      ) : groupBy !== "none" ? (
        <GroupedList groups={groups} currentUserId={currentUserId} />
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {filtered.map((sheet) => (
            <SheetRow key={sheet.id} sheet={sheet} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
