"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { CommentThread } from "./comment-thread"
import { CommentComposer } from "./comment-composer"

type User = { id: string; name: string | null; email: string; avatarUrl?: string | null }

type Comment = {
  id: string
  content: string
  authorId: string
  author: User
  anchor?: object | null
  createdAt: string
  updatedAt: string
  mentionedUsers: Array<{ user: { id: string; name: string | null } }>
  replies: Comment[]
}

export function CommentPanel({
  sheetId,
  sheetType,
  initialComments,
  currentUserId,
  allUsers,
}: {
  sheetId: string
  sheetType: "lyric" | "music"
  initialComments: Comment[]
  currentUserId: string
  allUsers: User[]
}) {
  const [comments, setComments] = useState(initialComments)

  const base = sheetType === "lyric" ? `/api/lyric-sheets/${sheetId}` : `/api/music-sheets/${sheetId}`

  async function addComment(content: string, mentionedUserIds: string[]) {
    const res = await fetch(`${base}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mentionedUserIds }),
    })
    if (res.ok) {
      const comment = await res.json()
      setComments((prev) => [
        ...prev,
        { ...comment, replies: [], mentionedUsers: [], createdAt: comment.createdAt, updatedAt: comment.updatedAt },
      ])
    }
  }

  async function addReply(parentId: string, content: string, mentionedUserIds: string[]) {
    const res = await fetch(`${base}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId, mentionedUserIds }),
    })
    if (res.ok) {
      const reply = await res.json()
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...c.replies, { ...reply, replies: [], mentionedUsers: [] }] }
            : c
        )
      )
    }
  }

  async function deleteComment(commentId: string) {
    const res = await fetch(`${base}/comments/${commentId}`, { method: "DELETE" })
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium">Comments</span>
        {comments.length > 0 && (
          <span className="text-xs text-gray-400">({comments.length})</span>
        )}
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-400 text-center pt-8">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              allUsers={allUsers}
              onReply={(content, mentions) => addReply(comment.id, content, mentions)}
              onDelete={() => deleteComment(comment.id)}
            />
          ))
        )}
      </div>

      <div className="border-t border-gray-100 p-4">
        <CommentComposer
          placeholder="Add a comment..."
          allUsers={allUsers}
          onSubmit={addComment}
        />
      </div>
    </div>
  )
}
