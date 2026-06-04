import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { order, hidden } = body as { order: string[]; hidden: string[] }

  await prisma.user.update({
    where: { id: user.id },
    data: { sidebarPreferences: { order, hidden } },
  })

  return NextResponse.json({ success: true })
}
