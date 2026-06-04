"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "@/lib/utils"

type PendingUser = {
  id: string
  email: string
  name: string | null
  createdAt: Date
  invitedBy: { name: string | null; email: string } | null
}

type ActiveUser = {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  createdAt: Date
}

export function PendingUsersTable({
  pendingUsers,
  allUsers,
}: {
  pendingUsers: PendingUser[]
  allUsers: ActiveUser[]
}) {
  const [pending, setPending] = useState(pendingUsers)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(userId: string, action: "approve" | "reject") {
    setLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setPending((prev) => prev.filter((u) => u.id !== userId))
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold mb-3">
          Pending approvals{" "}
          {pending.length > 0 && (
            <Badge variant="secondary">{pending.length}</Badge>
          )}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">No pending requests</p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {pending.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{user.name ?? user.email}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">
                    Requested {formatDistanceToNow(new Date(user.createdAt))}
                    {user.invitedBy && ` · invited by ${user.invitedBy.name ?? user.invitedBy.email}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(user.id, "approve")}
                    disabled={loading === user.id}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(user.id, "reject")}
                    disabled={loading === user.id}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">All users</h2>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {allUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{user.name ?? user.email}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
                  {user.role.toLowerCase()}
                </Badge>
                <Badge
                  variant={user.status === "ACTIVE" ? "default" : "secondary"}
                  className={`text-xs ${user.status === "ACTIVE" ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-600"}`}
                >
                  {user.status.toLowerCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
