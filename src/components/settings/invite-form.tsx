"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "@/lib/utils"

type Invite = {
  id: string
  email: string
  status: string
  createdAt: string
  expiresAt: string
}

export function InviteForm({ initialInvites }: { initialInvites: Invite[] }) {
  const [invites, setInvites] = useState(initialInvites)
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function send() {
    if (!email.trim()) return
    setSending(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to send invite")
      } else {
        setSuccess(`Invite sent to ${email.trim()}`)
        setEmail("")
        // Refresh invite list
        const listRes = await fetch("/api/invites")
        if (listRes.ok) setInvites(await listRes.json())
      }
    } finally {
      setSending(false)
    }
  }

  const statusLabel: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    EXPIRED: "Expired",
  }

  return (
    <div className="space-y-5">
      {/* Send form */}
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="collaborator@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); setSuccess("") }}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1"
        />
        <Button onClick={send} disabled={!email.trim() || sending}>
          {sending ? "Sending..." : "Send invite"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-gray-500">{success}</p>}

      {/* Sent invites */}
      {invites.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Sent invites</p>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <p className="text-sm">{inv.email}</p>
                  <p className="text-xs text-gray-400">
                    Sent {formatDistanceToNow(new Date(inv.createdAt))}
                    {inv.status === "PENDING" && ` · expires ${formatDistanceToNow(new Date(inv.expiresAt))}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  inv.status === "ACCEPTED"
                    ? "bg-gray-100 text-gray-600 border-gray-200"
                    : inv.status === "EXPIRED"
                    ? "bg-gray-50 text-gray-400 border-gray-100"
                    : "bg-black text-white border-black"
                }`}>
                  {statusLabel[inv.status] ?? inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
