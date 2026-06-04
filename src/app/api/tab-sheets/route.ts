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
  const ownership = searchParams.get("ownership")
  const visibility = searchParams.get("visibility")
  const tag = searchParams.get("tag")
  const search = searchParams.get("q")

  const sheets = await prisma.tabSheet.findMany({
    where: {
      AND: [
        {
          OR: [
            { ownerId: user.id },
            { visibility: "PUBLIC" },
            { shares: { some: { userId: user.id } } },
          ],
        },
        ownership === "mine" ? { ownerId: user.id } : {},
        ownership === "shared" ? { shares: { some: { userId: user.id } } } : {},
        visibility ? { visibility: visibility as "PRIVATE" | "SHARED" | "PUBLIC" } : {},
        tag ? { tags: { some: { tag: { name: tag } } } } : {},
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

  const sheet = await prisma.tabSheet.create({
    data: {
      title: parsed.data.title,
      ownerId: user.id,
      content: {},
    },
  })

  return NextResponse.json(sheet, { status: 201 })
}
