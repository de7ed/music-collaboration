import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendInviteEmail } from "@/lib/email"
import { z } from "zod"

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 })

  const { email } = parsed.data

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await prisma.invite.create({
    data: { email, invitedById: user.id, expiresAt },
  })

  await sendInviteEmail({
    to: email,
    inviterName: user.name ?? user.email,
    token: invite.token,
  })

  return NextResponse.json({ success: true })
}

export async function GET() {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const invites = await prisma.invite.findMany({
    where: { invitedById: user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(invites)
}
