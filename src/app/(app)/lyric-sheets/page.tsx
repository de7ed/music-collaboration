import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LyricSheetList } from "@/components/lyric-sheets/lyric-sheet-list"

export default async function LyricSheetsPage() {
  const user = await requireAuth()

  const sheets = await prisma.lyricSheet.findMany({
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
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const tags = await prisma.tag.findMany({
    where: { lyricSheetTags: { some: {} } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="max-w-5xl mx-auto">
      <LyricSheetList
        initialSheets={sheets.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          content: undefined,
        }))}
        currentUserId={user.id}
        availableTags={tags}
      />
    </div>
  )
}
