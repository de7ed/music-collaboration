import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getMusicSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"
import { getStorage } from "@/lib/storage"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const result = await getMusicSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const storage = await getStorage()
  const fileUrl = result.sheet.fileKey ? await storage.getUrl(result.sheet.fileKey) : null

  return NextResponse.json({ ...result.sheet, fileUrl, permission: result.permission })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const result = await getMusicSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!result.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const sheet = await prisma.musicSheet.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.visibility !== undefined && { visibility: body.visibility }),
      ...(body.lyricSheetId !== undefined && { lyricSheetId: body.lyricSheetId }),
      ...(body.fileKey !== undefined && { fileKey: body.fileKey }),
      ...(body.mimeType !== undefined && { mimeType: body.mimeType }),
      ...(body.sizeBytes !== undefined && { sizeBytes: body.sizeBytes }),
    },
  })

  return NextResponse.json(sheet)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const result = await getMusicSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!result.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const storage = await getStorage()
  if (result.sheet.fileKey) await storage.delete(result.sheet.fileKey)

  await prisma.musicSheet.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
