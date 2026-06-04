"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type User = { id: string; name: string | null; email: string }

// Parses @name patterns and resolves them to @[userId:xxx|Name] markers
function buildContent(text: string, users: User[]): { content: string; mentionedUserIds: string[] } {
  const mentionedUserIds: string[] = []
  const content = text.replace(/@(\S+)/g, (_, handle) => {
    const user = users.find(
      (u) => u.name?.toLowerCase() === handle.toLowerCase() ||
             u.email.toLowerCase().startsWith(handle.toLowerCase())
    )
    if (user) {
      if (!mentionedUserIds.includes(user.id)) mentionedUserIds.push(user.id)
      return `@[userId:${user.id}|${user.name ?? user.email}]`
    }
    return `@${handle}`
  })
  return { content, mentionedUserIds }
}

export function CommentComposer({
  placeholder = "Write a comment...",
  allUsers,
  onSubmit,
  onCancel,
  compact = false,
}: {
  placeholder?: string
  allUsers: User[]
  onSubmit: (content: string, mentionedUserIds: string[]) => Promise<void>
  onCancel?: () => void
  compact?: boolean
}) {
  const [text, setText] = useState("")
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const mentionSuggestions = mentionQuery !== null
    ? allUsers.filter(
        (u) =>
          u.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 5)
    : []

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setText(val)

    // Detect @mention trigger
    const cursorPos = e.target.selectionStart
    const textBefore = val.slice(0, cursorPos)
    const match = textBefore.match(/@(\w*)$/)
    setMentionQuery(match ? match[1] : null)
  }

  function insertMention(user: User) {
    const displayName = user.name ?? user.email.split("@")[0]
    const updated = text.replace(/@\w*$/, `@${displayName} `)
    setText(updated)
    setMentionQuery(null)
    textareaRef.current?.focus()
  }

  async function handleSubmit() {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const { content, mentionedUserIds } = buildContent(text, allUsers)
      await onSubmit(content, mentionedUserIds)
      setText("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-2 relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className={cn(
          "w-full text-sm border border-gray-200 rounded-md px-3 py-2 resize-none outline-none focus:border-black transition-colors",
          compact ? "text-xs" : ""
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit()
        }}
      />

      {mentionSuggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-56 bg-white border border-gray-200 rounded-md shadow-sm z-10">
          {mentionSuggestions.map((u) => (
            <button
              key={u.id}
              onMouseDown={() => insertMention(u)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
            >
              {u.name ?? u.email}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">⌘↵ to send · @name to mention</span>
        <div className="flex gap-1.5">
          {onCancel && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
          >
            {submitting ? "..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  )
}
