import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MusicSheetUploadForm } from "@/components/music-sheets/upload-form"

export default async function NewMusicSheetPage() {
  const user = await requireAuth()

  const lyricSheets = await prisma.lyricSheet.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { visibility: "PUBLIC" },
        { shares: { some: { userId: user.id } } },
      ],
    },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  })

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload music sheet</h1>
      <MusicSheetUploadForm lyricSheets={lyricSheets} />
    </div>
  )
}
