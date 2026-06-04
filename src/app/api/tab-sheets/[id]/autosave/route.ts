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
  if (result.permission !== "EDITOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { content } = await req.json()

  const existingAutosave = await prisma.tabSheetVersion.findFirst({
    where: { tabSheetId: id, isCheckIn: false },
    orderBy: { createdAt: "desc" },
  })

  await prisma.$transaction([
    existingAutosave
      ? prisma.tabSheetVersion.update({
          where: { id: existingAutosave.id },
          data: { content, createdById: user.id, createdAt: new Date() },
        })
      : prisma.tabSheetVersion.create({
          data: { tabSheetId: id, content, isCheckIn: false, createdById: user.id },
        }),
    prisma.tabSheet.update({ where: { id }, data: { content } }),
  ])

  return NextResponse.json({ saved: true })
}
