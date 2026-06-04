import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const status = req.nextUrl.searchParams.get("status") as UserStatus | null

  const users = await prisma.user.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      invitedBy: { select: { name: true, email: true } },
    },
  })

  return NextResponse.json(users)
}
