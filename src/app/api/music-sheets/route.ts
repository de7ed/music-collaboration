import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStorage } from "@/lib/storage"
import { z } from "zod"
import { randomUUID } from "crypto"

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const visibility = searchParams.get("visibility")
  const tag = searchParams.get("tag")
  const lyricSheetId = searchParams.get("lyricSheetId")

  const sheets = await prisma.musicSheet.findMany({
    where: {
      AND: [
        {
          OR: [
            { ownerId: user.id },
            { visibility: "PUBLIC" },
            { shares: { some: { userId: user.id } } },
          ],
        },
        visibility ? { visibility: visibility as "PRIVATE" | "SHARED" | "PUBLIC" } : {},
        tag ? { tags: { some: { tag: { name: tag } } } } : {},
        lyricSheetId ? { lyricSheetId } : {},
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      lyricSheet: { select: { id: true, title: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(sheets)
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  lyricSheetId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const contentType = req.headers.get("content-type") ?? ""

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string | null
    const lyricSheetId = formData.get("lyricSheetId") as string | null

    if (!file || !title) return NextResponse.json({ error: "Missing file or title" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split(".").pop() ?? "bin"
    const key = `${user.id}/${randomUUID()}.${ext}`

    const storage = await getStorage()
    await storage.upload(key, buffer, file.type)

    const sheet = await prisma.musicSheet.create({
      data: {
        title,
        ownerId: user.id,
        fileKey: key,
        mimeType: file.type,
        sizeBytes: buffer.length,
        lyricSheetId: lyricSheetId ?? null,
      },
    })

    return NextResponse.json(sheet, { status: 201 })
  }

  const body = createSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const sheet = await prisma.musicSheet.create({
    data: {
      title: body.data.title,
      ownerId: user.id,
      fileKey: "",
      mimeType: "",
      sizeBytes: 0,
      lyricSheetId: body.data.lyricSheetId ?? null,
    },
  })

  return NextResponse.json(sheet, { status: 201 })
}
