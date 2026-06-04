import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MusicSheetList } from "@/components/music-sheets/music-sheet-list"

export default async function MusicSheetsPage() {
  const user = await requireAuth()

  const sheets = await prisma.musicSheet.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { visibility: "PUBLIC" },
        { shares: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      shares: { where: { userId: user.id }, select: { id: true } },
      lyricSheet: { select: { id: true, title: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const [tags, allUsers] = await Promise.all([
    prisma.tag.findMany({
      where: { musicSheetTags: { some: {} } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="max-w-5xl mx-auto">
      <MusicSheetList
        initialSheets={sheets.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        }))}
        currentUserId={user.id}
        availableTags={tags}
        allUsers={allUsers}
      />
    </div>
  )
}
