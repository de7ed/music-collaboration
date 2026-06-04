import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get("q") ?? ""

  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      AND: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
    },
    select: { id: true, name: true, email: true, avatarUrl: true },
    take: 20,
  })

  return NextResponse.json(users)
}
