import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cursor = req.nextUrl.searchParams.get("cursor")
  const unreadOnly = req.nextUrl.searchParams.get("unread") === "1"

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly ? { readAt: null } : {}),
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return NextResponse.json(notifications)
}

export async function PATCH(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { ids, action } = await req.json()

  if (action === "markRead") {
    await prisma.notification.updateMany({
      where: { userId: user.id, id: { in: ids ?? [] } },
      data: { readAt: new Date() },
    })
  } else if (action === "markAllRead") {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    })
  }

  return NextResponse.json({ success: true })
}
