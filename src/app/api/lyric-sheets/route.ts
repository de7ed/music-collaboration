import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const ownership = searchParams.get("ownership") // "mine" | "shared" | "all"
  const visibility = searchParams.get("visibility") // "PRIVATE" | "SHARED" | "PUBLIC"
  const tag = searchParams.get("tag")
  const search = searchParams.get("q")

  // Sheets the user can see: owned, public, or shared with them
  const sheets = await prisma.lyricSheet.findMany({
    where: {
      AND: [
        // Access filter
        {
          OR: [
            { ownerId: user.id },
            { visibility: "PUBLIC" },
            { shares: { some: { userId: user.id } } },
          ],
        },
        // Ownership filter
        ownership === "mine" ? { ownerId: user.id } : {},
        ownership === "shared" ? { shares: { some: { userId: user.id } } } : {},
        // Visibility filter
        visibility ? { visibility: visibility as "PRIVATE" | "SHARED" | "PUBLIC" } : {},
        // Tag filter
        tag ? { tags: { some: { tag: { name: tag } } } } : {},
        // Search filter
        search ? { title: { contains: search, mode: "insensitive" } } : {},
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(sheets)
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
})

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const sheet = await prisma.lyricSheet.create({
    data: {
      title: parsed.data.title,
      ownerId: user.id,
      content: {},
    },
  })

  return NextResponse.json(sheet, { status: 201 })
}
