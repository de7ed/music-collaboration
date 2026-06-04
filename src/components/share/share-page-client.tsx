"use client"

import { useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { MessageSquare, LogIn, Music2, X, ChevronUp } from "lucide-react"
import { formatDistanceToNow, cn } from "@/lib/utils"

type Tag = { id: string; name: string }
type User = { id: string; name: string | null; email: string }

type Comment = {
  id: string
  content: string
  author: User
  createdAt: string
  replies: Comment[]
  mentionedUsers: unknown[]
  anchor: object | null
  updatedAt: string
  deletedAt: null
  authorId: string
  lyricSheetId: string | null
  musicSheetId: string | null
  parentId: string | null
}

interface Sheet {
  id: string
  title: string
  content: object
  owner: User
  tags: Tag[]
  updatedAt: string
}

function parseContent(content: string) {
  return content.replace(/@\[userId:[^|]+\|([^\]]+)\]/g, "@$1")
}

function CommentRow({ comment }: { comment: Comment }) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium">{comment.author.name ?? comment.author.email}</span>
          <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.createdAt))}</span>
        </div>
        <p className="text-sm text-gray-700">{parseContent(comment.content)}</p>
      </div>
      {comment.replies.length > 0 && (
        <div className="pl-3 border-l border-gray-100 space-y-2">
          {comment.replies.map((r) => (
            <div key={r.id}>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium">{r.author.name ?? r.author.email}</span>
                <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(r.createdAt))}</span>
              </div>
              <p className="text-sm text-gray-700">{parseContent(r.content)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SignUpPrompt() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 text-center space-y-2 bg-gray-50">
      <p className="text-sm font-medium">Want to join the conversation?</p>
      <p className="text-xs text-gray-500">Create an account to add comments and collaborate.</p>
      <Link href="/sign-up" className={cn(buttonVariants({ size: "sm" }), "mt-1")}>
        Request access
      </Link>
    </div>
  )
}

function CommentCTA({ viewer, sheetId }: { viewer: { id: string } | null; sheetId: string }) {
  const [showPrompt, setShowPrompt] = useState(false)

  if (viewer) {
    return (
      <Link
        href={`/lyric-sheets/${sheetId}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
      >
        <LogIn className="w-3.5 h-3.5 mr-1.5" />
        Open in Music Collab to comment
      </Link>
    )
  }

  return showPrompt ? (
    <SignUpPrompt />
  ) : (
    <button
      onClick={() => setShowPrompt(true)}
      className="w-full text-left text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg px-3 py-2.5 hover:border-gray-300 hover:text-gray-600 transition-colors"
    >
      Add a comment...
    </button>
  )
}

function CommentsPanel({
  comments,
  viewer,
  sheetId,
}: {
  comments: Comment[]
  viewer: { id: string; name: string | null; email: string } | null
  sheetId: string
}) {
  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-xs text-gray-400">No comments yet.</p>
      ) : (
        <div className="space-y-4 divide-y divide-gray-100">
          {comments.map((c) => (
            <div key={c.id} className="pt-4 first:pt-0">
              <CommentRow comment={c} />
            </div>
          ))}
        </div>
      )}
      <div className="pt-2">
        <CommentCTA viewer={viewer} sheetId={sheetId} />
      </div>
    </div>
  )
}

export function SharePageClient({
  sheet,
  comments,
  viewer,
}: {
  sheet: Sheet
  comments: Comment[]
  viewer: { id: string; name: string | null; email: string } | null
}) {
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: sheet.content,
    editable: false,
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Platform banner */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Music2 className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 truncate">
            Shared on <span className="font-medium text-black">Music Collab</span>
            <span className="hidden sm:inline"> — a private workspace for bands and collaborators</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {viewer ? (
            <Link href="/lyric-sheets" className="text-xs text-gray-500 hover:text-black transition-colors whitespace-nowrap">
              Go to app →
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}>
                Sign in
              </Link>
              <Link href="/sign-up" className={cn(buttonVariants({ size: "sm" }), "h-7 text-xs")}>
                Request access
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8 md:flex md:gap-10">
        {/* Lyrics — full width on mobile, flex-1 on desktop */}
        <div className="flex-1 min-w-0 pb-24 md:pb-0">
          <div className="space-y-3 mb-8">
            <h1 className="text-3xl font-bold">{sheet.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>by {sheet.owner.name ?? sheet.owner.email}</span>
              <span>·</span>
              <span>updated {formatDistanceToNow(new Date(sheet.updatedAt))}</span>
            </div>
            {sheet.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {sheet.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="prose prose-sm max-w-none">
            <EditorContent editor={editor} className="[&_.ProseMirror]:outline-none" />
          </div>
        </div>

        {/* Desktop comments sidebar — hidden on mobile */}
        <div className="hidden md:block w-72 shrink-0">
          <div className="sticky top-16 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Comments</span>
              {comments.length > 0 && (
                <span className="text-xs text-gray-400">({comments.length})</span>
              )}
            </div>
            <CommentsPanel comments={comments} viewer={viewer} sheetId={sheet.id} />
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-20">
        {/* Comments sheet — slides up */}
        {mobileCommentsOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-10"
              onClick={() => setMobileCommentsOpen(false)}
            />
            {/* Panel */}
            <div className="relative z-20 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">Comments</span>
                  {comments.length > 0 && (
                    <span className="text-xs text-gray-400">({comments.length})</span>
                  )}
                </div>
                <button onClick={() => setMobileCommentsOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-4 py-4">
                <CommentsPanel comments={comments} viewer={viewer} sheetId={sheet.id} />
              </div>
            </div>
          </>
        )}

        {/* Sticky trigger bar */}
        {!mobileCommentsOpen && (
          <button
            onClick={() => setMobileCommentsOpen(true)}
            className="w-full bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "No comments yet"}
              </span>
            </div>
            <ChevronUp className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}
