import { requireAuth } from "@/lib/auth"
import { getLyricSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { VersionHistory } from "@/components/lyric-sheets/version-history/version-list"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function VersionHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params

  const result = await getLyricSheetWithAccess(id, user.id)
  if (!result) notFound()

  const versions = await prisma.lyricSheetVersion.findMany({
    where: { lyricSheetId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      isCheckIn: true,
      message: true,
      createdById: true,
      createdAt: true,
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/lyric-sheets/${id}`} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-2">
          <ArrowLeft className="w-3 h-3" />
          Back to editor
        </Link>
        <h1 className="text-2xl font-bold">{result.sheet.title}</h1>
        <p className="text-sm text-gray-500 mt-1">Version history</p>
      </div>
      <VersionHistory
        versions={versions.map((v) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        }))}
        sheetId={id}
        isOwner={result.isOwner}
        currentUserId={user.id}
      />
    </div>
  )
}
