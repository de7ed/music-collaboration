import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getTabSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"
import { getStorage } from "@/lib/storage"
import { randomUUID } from "crypto"

const GP_MIME_TYPES: Record<string, string> = {
  gp3: "application/x-guitar-pro",
  gp4: "application/x-guitar-pro",
  gp5: "application/x-guitar-pro",
  gpx: "application/x-gpx+xml",
}

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
  const result = await getTabSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!result.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (!GP_MIME_TYPES[ext]) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a .gp3, .gp4, .gp5, or .gpx file." },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = `tab-sheets/${user.id}/${randomUUID()}.${ext}`

  const storage = await getStorage()
  await storage.upload(key, buffer, GP_MIME_TYPES[ext])

  await prisma.tabSheet.update({
    where: { id },
    data: { content: { format: "guitarpro", fileKey: key } },
  })

  return NextResponse.json({ fileKey: key })
}
