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

  const tags = await prisma.tag.findMany({
    where: q ? { name: { contains: q.toLowerCase() } } : undefined,
    orderBy: { name: "asc" },
    take: 20,
  })

  return NextResponse.json(tags)
}
