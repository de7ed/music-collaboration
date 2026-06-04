"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
import Link from "next/link"
import { cn, formatBytes } from "@/lib/utils"
import { ShareDialog } from "@/components/lyric-sheets/sharing/share-dialog"
import { TagInput } from "@/components/tags/tag-input"

type User = { id: string; name: string | null; email: string }
type Share = { id: string; userId: string; permission: string }

interface Sheet {
  id: string
  title: string
  mimeType: string
  sizeBytes: number
  visibility: "PRIVATE" | "SHARED" | "PUBLIC"
  ownerId: string
  fileUrl: string | null
  tags: Array<{ id: string; name: string }>
  shares: Share[]
  lyricSheet: { id: string; title: string } | null
}

export function MusicSheetViewer({
  sheet,
  isOwner,
  permission,
  currentUserId,
  allUsers,
}: {
  sheet: Sheet
  isOwner: boolean
  permission: "EDITOR" | "VIEWER"
  currentUserId: string
  allUsers: User[]
}) {
  const [tags, setTags] = useState(sheet.tags)
  const [shareOpen, setShareOpen] = useState(false)
  const [visibility, setVisibility] = useState(sheet.visibility)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-3 border-b border-gray-100 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold flex-1 min-w-0 truncate">{sheet.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <select
                value={visibility}
                onChange={async (e) => {
                  const v = e.target.value as "PRIVATE" | "PUBLIC"
                  setVisibility(v)
                  await fetch(`/api/music-sheets/${sheet.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ visibility: v }),
                  })
                }}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </select>
            )}
            {isOwner && (
              <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
                <Settings2 className="w-3.5 h-3.5 mr-1" />
                Share
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">
            {formatBytes(sheet.sizeBytes)} · {sheet.mimeType}
          </span>
          {sheet.lyricSheet && (
            <Link
              href={`/lyric-sheets/${sheet.lyricSheet.id}`}
              className="text-xs text-gray-500 underline underline-offset-2"
            >
              ↗ {sheet.lyricSheet.title}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
              {isOwner && (
                <button
                  className="ml-1 opacity-50 hover:opacity-100"
                  onClick={async () => {
                    await fetch(`/api/music-sheets/${sheet.id}/tags/${tag.id}`, { method: "DELETE" })
                    setTags((prev) => prev.filter((t) => t.id !== tag.id))
                  }}
                >
                  ×
                </button>
              )}
            </Badge>
          ))}
          {isOwner && (
            <TagInput
              onAdd={async (name) => {
                const res = await fetch(`/api/music-sheets/${sheet.id}/tags`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name }),
                })
                if (res.ok) {
                  const tag = await res.json()
                  setTags((prev) => [...prev, tag])
                }
              }}
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {sheet.fileUrl ? (
          sheet.mimeType === "application/pdf" || sheet.mimeType.endsWith("pdf") ? (
            <iframe
              src={sheet.fileUrl}
              className="w-full h-full border-0"
              title={sheet.title}
            />
          ) : (
            <div className="p-6 flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-500">Preview not available for this file type</p>
                <a href={sheet.fileUrl} download className={cn(buttonVariants({ variant: "outline" }))}>
                  Download file
                </a>
              </div>
            </div>
          )
        ) : (
          <div className="p-6 text-center text-gray-400 text-sm">No file uploaded</div>
        )}
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        sheetId={sheet.id}
        sheetType="music"
        allUsers={allUsers}
        currentShares={sheet.shares}
      />
    </div>
  )
}
