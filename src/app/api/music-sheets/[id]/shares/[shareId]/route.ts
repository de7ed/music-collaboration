import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getMusicSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, shareId } = await params
  const result = await getMusicSheetWithAccess(id, user.id)
  if (!result?.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { permission } = await req.json()
  const share = await prisma.musicSheetShare.update({ where: { id: shareId }, data: { permission } })

  return NextResponse.json(share)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, shareId } = await params
  const result = await getMusicSheetWithAccess(id, user.id)
  if (!result?.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.musicSheetShare.delete({ where: { id: shareId } })

  return NextResponse.json({ success: true })
}
