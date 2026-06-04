import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getMusicSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"

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

  const shares = await prisma.musicSheetShare.findMany({
    where: { musicSheetId: id },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  })

  return NextResponse.json(shares)
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
  const result = await getMusicSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!result.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId, permission = "VIEWER" } = await req.json()

  const share = await prisma.musicSheetShare.upsert({
    where: { musicSheetId_userId: { musicSheetId: id, userId } },
    create: { musicSheetId: id, userId, permission },
    update: { permission },
  })

  if (result.sheet.visibility === "PRIVATE") {
    await prisma.musicSheet.update({ where: { id }, data: { visibility: "SHARED" } })
  }

  return NextResponse.json(share, { status: 201 })
}
