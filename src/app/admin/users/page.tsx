import { prisma } from "@/lib/prisma"
import { PendingUsersTable } from "@/components/admin/pending-users-table"

export default async function AdminUsersPage() {
  const pendingUsers = await prisma.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      invitedBy: { select: { name: true, email: true } },
    },
  })

  const allUsers = await prisma.user.findMany({
    where: { status: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Approve or reject pending account requests</p>
      </div>
      <PendingUsersTable pendingUsers={pendingUsers} allUsers={allUsers} />
    </div>
  )
}
