import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getLyricSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, tagId } = await params
  const result = await getLyricSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!result.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.lyricSheetTag.deleteMany({
    where: { lyricSheetId: id, tagId },
  })

  return NextResponse.json({ success: true })
}
