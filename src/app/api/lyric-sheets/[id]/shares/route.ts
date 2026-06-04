import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getLyricSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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
  const result = await getLyricSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const shares = await prisma.lyricSheetShare.findMany({
    where: { lyricSheetId: id },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  })

  return NextResponse.json(shares)
}

const addSchema = z.object({
  userId: z.string(),
  permission: z.enum(["VIEWER", "EDITOR"]).default("VIEWER"),
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
  if (!result.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = addSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const share = await prisma.lyricSheetShare.upsert({
    where: { lyricSheetId_userId: { lyricSheetId: id, userId: body.data.userId } },
    create: { lyricSheetId: id, userId: body.data.userId, permission: body.data.permission },
    update: { permission: body.data.permission },
  })

  // Update visibility to SHARED if it was PRIVATE
  if (result.sheet.visibility === "PRIVATE") {
    await prisma.lyricSheet.update({ where: { id }, data: { visibility: "SHARED" } })
  }

  return NextResponse.json(share, { status: 201 })
}
