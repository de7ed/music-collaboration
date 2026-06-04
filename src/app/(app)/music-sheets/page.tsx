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
      lyricSheet: { select: { id: true, title: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const tags = await prisma.tag.findMany({
    where: { musicSheetTags: { some: {} } },
    orderBy: { name: "asc" },
  })

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
      />
    </div>
  )
}
