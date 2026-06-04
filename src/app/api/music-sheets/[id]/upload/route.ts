import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getMusicSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"
import { getStorage } from "@/lib/storage"
import { randomUUID } from "crypto"

export async function POST(
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

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split(".").pop() ?? "bin"
  const key = `${user.id}/${randomUUID()}.${ext}`

  const storage = await getStorage()
  await storage.upload(key, buffer, file.type)

  await prisma.musicSheet.update({
    where: { id },
    data: { fileKey: key, mimeType: file.type, sizeBytes: buffer.length },
  })

  return NextResponse.json({ fileKey: key })
}
