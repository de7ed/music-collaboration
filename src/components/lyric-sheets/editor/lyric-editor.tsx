"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import { useState, useCallback } from "react"
import { useAutosave } from "@/hooks/use-autosave"
import { EditorToolbar } from "./editor-toolbar"
import { CheckInDialog } from "./checkin-dialog"
import { ShareDialog } from "../sharing/share-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings2, History, GitCommitHorizontal, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { TagInput } from "@/components/tags/tag-input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type Share = { id: string; userId: string; permission: string }
type User = { id: string; name: string | null; email: string }

interface Sheet {
  id: string
  title: string
  content: object
  visibility: "PRIVATE" | "SHARED" | "PUBLIC"
  ownerId: string
  tags: Array<{ id: string; name: string }>
  shares: Share[]
  owner: User
}

const visibilityLabels = { PRIVATE: "Private", SHARED: "Shared", PUBLIC: "Public" }

export function LyricSheetEditor({
  sheet,
  permission,
  isOwner,
  currentUserId,
  allUsers,
}: {
  sheet: Sheet
  permission: "EDITOR" | "VIEWER"
  isOwner: boolean
  currentUserId: string
  allUsers: User[]
}) {
  const [title, setTitle] = useState(sheet.title)
  const [visibility, setVisibility] = useState(sheet.visibility)
  const [tags, setTags] = useState(sheet.tags)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editorContent, setEditorContent] = useState<object | null>(null)
  const router = useRouter()

  const isEditor = permission === "EDITOR"

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Start writing your lyrics..." }),
    ],
    content: sheet.content,
    editable: isEditor,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getJSON())
    },
  })

  const saveStatus = useAutosave({
    sheetId: sheet.id,
    content: editorContent,
    enabled: isEditor,
  })

  const handleVisibilityChange = useCallback(
    async (newVis: "PRIVATE" | "SHARED" | "PUBLIC") => {
      setVisibility(newVis)
      await fetch(`/api/lyric-sheets/${sheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVis }),
      })
    },
    [sheet.id]
  )

  const handleTitleBlur = useCallback(async () => {
    if (title !== sheet.title) {
      await fetch(`/api/lyric-sheets/${sheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
    }
  }, [title, sheet.id, sheet.title])

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/lyric-sheets/${sheet.id}`, { method: "DELETE" })
      router.push("/lyric-sheets")
    } finally {
      setDeleting(false)
    }
  }

  const saveStatusLabel = {
    saved: "Saved",
    saving: "Saving...",
    unsaved: "Unsaved changes",
    idle: "",
  }[saveStatus]

  return (
    <div className="flex flex-col h-full">
      {/* Sheet header */}
      <div className="px-6 pt-6 pb-3 border-b border-gray-100 space-y-2">
        {/* Back link */}
        <Link href="/lyric-sheets" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-1">
          <ArrowLeft className="w-3 h-3" />
          Lyric Sheets
        </Link>
        <div className="flex items-start justify-between gap-4">
          {isOwner ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="text-2xl font-bold bg-transparent border-none outline-none flex-1 min-w-0"
              placeholder="Untitled"
            />
          ) : (
            <h1 className="text-2xl font-bold flex-1 min-w-0 truncate">{title}</h1>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <select
                value={visibility === "SHARED" ? "PRIVATE" : visibility}
                onChange={(e) => handleVisibilityChange(e.target.value as "PRIVATE" | "PUBLIC")}
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

            {isEditor && (
              <Button size="sm" variant="outline" onClick={() => setCheckInOpen(true)}>
                <GitCommitHorizontal className="w-3.5 h-3.5 mr-1" />
                Check in
              </Button>
            )}

            <Link
              href={`/lyric-sheets/${sheet.id}/history`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <History className="w-3.5 h-3.5 mr-1" />
              History
            </Link>

            {isOwner && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteOpen(true)}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
              {isOwner && (
                <button
                  className="ml-1 opacity-50 hover:opacity-100"
                  onClick={async () => {
                    await fetch(`/api/lyric-sheets/${sheet.id}/tags/${tag.id}`, { method: "DELETE" })
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
                const res = await fetch(`/api/lyric-sheets/${sheet.id}/tags`, {
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

        {isEditor && (
          <div className="flex items-center justify-between">
            <EditorToolbar editor={editor} />
            <span className="text-xs text-gray-400">{saveStatusLabel}</span>
          </div>
        )}
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none min-h-full focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-64"
        />
      </div>

      <CheckInDialog
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        sheetId={sheet.id}
        currentContent={editor?.getJSON() ?? {}}
      />

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        sheetId={sheet.id}
        sheetType="lyric"
        allUsers={allUsers}
        currentShares={sheet.shares}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete lyric sheet"
        description={`"${sheet.title}" will be permanently deleted, including all versions and comments. This cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}
