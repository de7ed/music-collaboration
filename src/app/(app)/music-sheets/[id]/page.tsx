import { requireAuth } from "@/lib/auth"
import { getMusicSheetWithAccess } from "@/lib/sheet-access"
import { getStorage } from "@/lib/storage"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { MusicSheetViewer } from "@/components/music-sheets/music-sheet-viewer"
import { CommentPanel } from "@/components/comments/comment-panel"

export default async function MusicSheetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params

  const result = await getMusicSheetWithAccess(id, user.id)
  if (!result) notFound()

  // Re-fetch with lyricSheet included (getMusicSheetWithAccess doesn't include it by default)
  const sheetWithLyric = await prisma.musicSheet.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: true,
      tags: { include: { tag: true } },
      lyricSheet: { select: { id: true, title: true } },
    },
  })
  if (!sheetWithLyric) notFound()

  const { isOwner, permission } = result
  const sheet = sheetWithLyric

  const storage = await getStorage()
  const fileUrl = sheet.fileKey ? await storage.getUrl(sheet.fileKey) : null

  const comments = await prisma.comment.findMany({
    where: { musicSheetId: id, parentId: null, deletedAt: null },
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
      <div className="flex-1 min-w-0 overflow-hidden">
        <MusicSheetViewer
          sheet={{
            id: sheet.id,
            title: sheet.title,
            mimeType: sheet.mimeType,
            sizeBytes: sheet.sizeBytes,
            visibility: sheet.visibility,
            ownerId: sheet.ownerId,
            fileUrl,
            tags: sheet.tags.map((t: { tag: { id: string; name: string } }) => t.tag),
            shares: sheet.shares,
            lyricSheet: sheet.lyricSheet,
          }}
          isOwner={isOwner}
          permission={permission as "EDITOR" | "VIEWER"}
          currentUserId={user.id}
          allUsers={allUsers}
        />
      </div>
      <div className="w-80 shrink-0 border-l border-gray-200 overflow-hidden flex flex-col">
        <CommentPanel
          sheetId={id}
          sheetType="music"
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
