"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

async function patchUser(userId: string, body: Record<string, unknown>) {
  return fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export function PendingUsersTable({
  pendingUsers,
  allUsers,
}: {
  pendingUsers: PendingUser[]
  allUsers: ActiveUser[]
}) {
  const [pending, setPending] = useState(pendingUsers)
  const [users, setUsers] = useState(allUsers)
  const [loading, setLoading] = useState<string | null>(null)

  async function handlePendingAction(userId: string, action: "approve" | "reject") {
    setLoading(userId)
    try {
      const res = await patchUser(userId, { action })
      if (res.ok) {
        const approved = pending.find((u) => u.id === userId)
        setPending((prev) => prev.filter((u) => u.id !== userId))
        if (action === "approve" && approved) {
          setUsers((prev) => [
            {
              id: approved.id,
              email: approved.email,
              name: approved.name,
              role: "STANDARD",
              status: "ACTIVE",
              createdAt: approved.createdAt,
            },
            ...prev,
          ])
        }
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleStatusChange(userId: string, action: "activate" | "suspend" | "reject") {
    setLoading(userId)
    try {
      const res = await patchUser(userId, { action })
      if (res.ok) {
        const statusMap = { activate: "ACTIVE", suspend: "SUSPENDED", reject: "REJECTED" }
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: statusMap[action] } : u))
        )
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleRoleChange(userId: string, role: "ADMIN" | "STANDARD") {
    setLoading(userId)
    try {
      const res = await patchUser(userId, { action: "changeRole", role })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Pending approvals */}
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
                    onClick={() => handlePendingAction(user.id, "approve")}
                    disabled={loading === user.id}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePendingAction(user.id, "reject")}
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

      {/* All users */}
      <section>
        <h2 className="text-base font-semibold mb-3">All users</h2>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{user.name ?? user.email}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="flex gap-2 items-center">
                {/* Role badge — click to toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={loading === user.id}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                      className="text-xs hover:opacity-80 transition-opacity"
                    >
                      {user.role.toLowerCase()}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, "STANDARD")}
                      disabled={user.role === "STANDARD"}
                    >
                      Standard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, "ADMIN")}
                      disabled={user.role === "ADMIN"}
                    >
                      Admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status badge — click to change */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={loading === user.id}
                    className="cursor-pointer"
                  >
                    <Badge
                      className={`text-xs hover:opacity-80 transition-opacity ${
                        user.status === "ACTIVE"
                          ? "bg-blue-800 text-white"
                          : user.status === "SUSPENDED"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {user.status.toLowerCase()}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user.status !== "ACTIVE" && (
                      <DropdownMenuItem onClick={() => handleStatusChange(user.id, "activate")}>
                        Activate
                      </DropdownMenuItem>
                    )}
                    {user.status !== "SUSPENDED" && (
                      <DropdownMenuItem onClick={() => handleStatusChange(user.id, "suspend")}>
                        Suspend
                      </DropdownMenuItem>
                    )}
                    {user.status !== "REJECTED" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleStatusChange(user.id, "reject")}
                        >
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
