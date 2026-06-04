import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getTabSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, commentId } = await params
  const result = await getTabSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const comment = await prisma.comment.findFirst({ where: { id: commentId, tabSheetId: id } })
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (comment.authorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { content } = await req.json()
  const updated = await prisma.comment.update({ where: { id: commentId }, data: { content } })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, commentId } = await params
  const result = await getTabSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const comment = await prisma.comment.findFirst({ where: { id: commentId, tabSheetId: id } })
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (comment.authorId !== user.id && !result.isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } })

  return NextResponse.json({ success: true })
}
