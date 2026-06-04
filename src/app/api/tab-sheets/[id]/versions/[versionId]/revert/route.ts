import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getTabSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, versionId } = await params
  const result = await getTabSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!result.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const version = await prisma.tabSheetVersion.findFirst({
    where: { id: versionId, tabSheetId: id },
  })
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 })

  await prisma.$transaction([
    prisma.tabSheet.update({ where: { id }, data: { content: version.content as object } }),
    prisma.tabSheetVersion.create({
      data: {
        tabSheetId: id,
        content: version.content as object,
        isCheckIn: true,
        message: `Reverted to: ${version.message ?? "autosave"}`,
        createdById: user.id,
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
