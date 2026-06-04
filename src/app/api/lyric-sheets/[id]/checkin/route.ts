import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getLyricSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  content: z.unknown(),
  message: z.string().min(1).max(500),
})

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
  const result = await getLyricSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (result.permission !== "EDITOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const [version] = await prisma.$transaction([
    prisma.lyricSheetVersion.create({
      data: {
        lyricSheetId: id,
        content: body.data.content as object,
        isCheckIn: true,
        message: body.data.message,
        createdById: user.id,
      },
    }),
    prisma.lyricSheet.update({ where: { id }, data: { content: body.data.content as object } }),
  ])

  return NextResponse.json(version, { status: 201 })
}
