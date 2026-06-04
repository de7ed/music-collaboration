import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getTabSheetWithAccess } from "@/lib/sheet-access"
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
  const result = await getTabSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const versions = await prisma.tabSheetVersion.findMany({
    where: { tabSheetId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      isCheckIn: true,
      message: true,
      createdById: true,
      createdAt: true,
    },
  })

  return NextResponse.json(versions)
}
