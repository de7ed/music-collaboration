import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getTabSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"

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

  const { name } = await req.json()
  const normalized = name.toLowerCase().trim()

  const tag = await prisma.tag.upsert({
    where: { name: normalized },
    create: { name: normalized },
    update: {},
  })

  await prisma.tabSheetTag.upsert({
    where: { tabSheetId_tagId: { tabSheetId: id, tagId: tag.id } },
    create: { tabSheetId: id, tagId: tag.id },
    update: {},
  })

  return NextResponse.json(tag, { status: 201 })
}
