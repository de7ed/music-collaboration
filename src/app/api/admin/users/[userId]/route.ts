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
  const { action, note } = body as { action: "approve" | "reject" | "suspend"; note?: string }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const statusMap = { approve: "ACTIVE", reject: "REJECTED", suspend: "SUSPENDED" } as const
  const actionTypeMap: Record<string, AdminActionType> = {
    approve: AdminActionType.APPROVE_USER,
    reject: AdminActionType.REJECT_USER,
    suspend: AdminActionType.SUSPEND_USER,
  }

  const newStatus = statusMap[action]

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: newStatus } }),
    prisma.adminAction.create({
      data: { adminId: admin.id, actionType: actionTypeMap[action], targetId: userId, note },
    }),
  ])

  // Update Clerk metadata
  const client = await clerkClient()
  const clerkStatus = action === "approve" ? "active" : action === "reject" ? "rejected" : "suspended"
  await client.users.updateUser(targetUser.clerkId, {
    publicMetadata: { status: clerkStatus, role: targetUser.role.toLowerCase() },
  })

  // Send email notification
  if (action === "approve") {
    await sendApprovalEmail({ to: targetUser.email, name: targetUser.name ?? targetUser.email })
  } else if (action === "reject") {
    await sendRejectionEmail({ to: targetUser.email, name: targetUser.name ?? targetUser.email })
  }

  return NextResponse.json({ success: true })
}
