"use client"

import { useState } from "react"
import { formatDistanceToNow } from "@/lib/utils"
import { CommentComposer } from "./comment-composer"

type User = { id: string; name: string | null; email: string; avatarUrl?: string | null }

type Comment = {
  id: string
  content: string
  authorId: string
  author: User
  createdAt: string
  replies: Comment[]
}

// Parse @[userId:xxx|Name] markers into display text
function parseContent(content: string) {
  return content.replace(/@\[userId:[^|]+\|([^\]]+)\]/g, "@$1")
}

export function CommentThread({
  comment,
  currentUserId,
  allUsers,
  onReply,
  onDelete,
}: {
  comment: Comment
  currentUserId: string
  allUsers: User[]
  onReply: (content: string, mentions: string[]) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [replying, setReplying] = useState(false)

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium">
            {comment.author.name ?? comment.author.email}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(comment.createdAt))}
            </span>
            {comment.authorId === currentUserId && (
              <button
                onClick={onDelete}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{parseContent(comment.content)}</p>
        <button
          onClick={() => setReplying(!replying)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Reply
        </button>
      </div>

      {comment.replies.length > 0 && (
        <div className="pl-3 border-l border-gray-100 space-y-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="space-y-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium">
                  {reply.author.name ?? reply.author.email}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(reply.createdAt))}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{parseContent(reply.content)}</p>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="pl-3 border-l border-gray-200">
          <CommentComposer
            placeholder="Write a reply..."
            allUsers={allUsers}
            onSubmit={async (content, mentions) => {
              await onReply(content, mentions)
              setReplying(false)
            }}
            onCancel={() => setReplying(false)}
            compact
          />
        </div>
      )}
    </div>
  )
}
