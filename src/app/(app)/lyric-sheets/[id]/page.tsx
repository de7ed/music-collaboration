import { requireAuth } from "@/lib/auth"
import { getLyricSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { LyricSheetEditor } from "@/components/lyric-sheets/editor/lyric-editor"
import { CommentPanel } from "@/components/comments/comment-panel"

export default async function LyricSheetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params

  const result = await getLyricSheetWithAccess(id, user.id)
  if (!result) notFound()

  const { sheet, isOwner, permission } = result

  const comments = await prisma.comment.findMany({
    where: { lyricSheetId: id, parentId: null, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      mentionedUsers: { include: { user: { select: { id: true, name: true } } } },
      replies: {
        where: { deletedAt: null },
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          mentionedUsers: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const allUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, email: true },
  })

  return (
    <div className="flex h-full gap-0 -m-6">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <LyricSheetEditor
          sheet={{
            id: sheet.id,
            title: sheet.title,
            content: sheet.content as object,
            visibility: sheet.visibility,
            ownerId: sheet.ownerId,
            tags: sheet.tags.map((t: { tag: { id: string; name: string } }) => t.tag),
            shares: sheet.shares,
            owner: sheet.owner,
          }}
          permission={permission as "EDITOR" | "VIEWER"}
          isOwner={isOwner}
          currentUserId={user.id}
          allUsers={allUsers}
        />
      </div>
      <div className="w-80 shrink-0 border-l border-gray-200 overflow-hidden flex flex-col">
        <CommentPanel
          sheetId={id}
          sheetType="lyric"
          initialComments={comments.map((c) => ({
            ...c,
            anchor: (c.anchor as object | null) ?? null,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            replies: c.replies.map((r) => ({
              ...r,
              anchor: (r.anchor as object | null) ?? null,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
              replies: [],
            })),
          }))}
          currentUserId={user.id}
          allUsers={allUsers}
        />
      </div>
    </div>
  )
}
