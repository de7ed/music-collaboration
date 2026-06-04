import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getLyricSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, versionId } = await params
  const result = await getLyricSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Only owner can revert
  if (!result.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const version = await prisma.lyricSheetVersion.findFirst({
    where: { id: versionId, lyricSheetId: id },
  })
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 })

  await prisma.$transaction([
    prisma.lyricSheet.update({ where: { id }, data: { content: version.content as object } }),
    prisma.lyricSheetVersion.create({
      data: {
        lyricSheetId: id,
        content: version.content as object,
        isCheckIn: true,
        message: `Reverted to: ${version.message ?? "autosave"}`,
        createdById: user.id,
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
