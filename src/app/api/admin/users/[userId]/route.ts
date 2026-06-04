import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clerkClient } from "@clerk/nextjs/server"
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email"
import { AdminActionType } from "@prisma/client"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let admin
  try {
    admin = await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await params
  const body = await req.json()
  const { action, note } = body as {
    action: "approve" | "reject" | "suspend" | "activate" | "changeRole"
    role?: "ADMIN" | "STANDARD"
    note?: string
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const client = await clerkClient()

  if (action === "changeRole") {
    const newRole = body.role as "ADMIN" | "STANDARD"
    if (!newRole) return NextResponse.json({ error: "role required" }, { status: 400 })

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { role: newRole } }),
      prisma.adminAction.create({
        data: { adminId: admin.id, actionType: AdminActionType.CHANGE_ROLE, targetId: userId, note },
      }),
    ])

    await client.users.updateUser(targetUser.clerkId, {
      publicMetadata: { status: targetUser.status.toLowerCase(), role: newRole.toLowerCase() },
    })

    return NextResponse.json({ success: true })
  }

  const statusMap = {
    approve: "ACTIVE",
    activate: "ACTIVE",
    reject: "REJECTED",
    suspend: "SUSPENDED",
  } as const
  const actionTypeMap: Record<string, AdminActionType> = {
    approve: AdminActionType.APPROVE_USER,
    activate: AdminActionType.APPROVE_USER,
    reject: AdminActionType.REJECT_USER,
    suspend: AdminActionType.SUSPEND_USER,
  }

  const newStatus = statusMap[action as keyof typeof statusMap]

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: newStatus } }),
    prisma.adminAction.create({
      data: { adminId: admin.id, actionType: actionTypeMap[action], targetId: userId, note },
    }),
  ])

  const clerkStatus = newStatus.toLowerCase()
  await client.users.updateUser(targetUser.clerkId, {
    publicMetadata: { status: clerkStatus, role: targetUser.role.toLowerCase() },
  })

  if (action === "approve" || action === "activate") {
    await sendApprovalEmail({ to: targetUser.email, name: targetUser.name ?? targetUser.email })
  } else if (action === "reject") {
    await sendRejectionEmail({ to: targetUser.email, name: targetUser.name ?? targetUser.email })
  }

  return NextResponse.json({ success: true })
}
