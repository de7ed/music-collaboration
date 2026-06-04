"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

type User = { id: string; name: string | null; email: string }
type Share = { id: string; userId: string; permission: string }

export function ShareDialog({
  open,
  onClose,
  sheetId,
  sheetType,
  allUsers,
  currentShares,
}: {
  open: boolean
  onClose: () => void
  sheetId: string
  sheetType: "lyric" | "music"
  allUsers: User[]
  currentShares: Share[]
}) {
  const [shares, setShares] = useState(currentShares)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  const base = sheetType === "lyric" ? `/api/lyric-sheets/${sheetId}` : `/api/music-sheets/${sheetId}`

  const sharedUserIds = new Set(shares.map((s) => s.userId))
  const suggestions = query.trim()
    ? allUsers.filter(
        (u) =>
          !sharedUserIds.has(u.id) &&
          ((u.name?.toLowerCase().includes(query.toLowerCase())) ||
            u.email.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : []

  async function addShare(userId: string) {
    setLoading(userId)
    try {
      const res = await fetch(`${base}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, permission: "VIEWER" }),
      })
      if (res.ok) {
        const share = await res.json()
        setShares((prev) => [...prev, share])
        setQuery("")
      }
    } finally {
      setLoading(null)
    }
  }

  async function changePermission(shareId: string, permission: string) {
    const res = await fetch(`${base}/shares/${shareId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission }),
    })
    if (res.ok) {
      setShares((prev) => prev.map((s) => (s.id === shareId ? { ...s, permission } : s)))
    }
  }

  async function removeShare(shareId: string) {
    const res = await fetch(`${base}/shares/${shareId}`, { method: "DELETE" })
    if (res.ok) setShares((prev) => prev.filter((s) => s.id !== shareId))
  }

  return (
    <Modal open={open} onClose={onClose} title="Share sheet">
      <div className="space-y-4">
        {/* User search */}
        <div className="space-y-1.5">
          <Input
            placeholder="Search users to add..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {suggestions.length > 0 && (
            <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm">
              {suggestions.map((u) => (
                <button
                  key={u.id}
                  onClick={() => addShare(u.id)}
                  disabled={loading === u.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between disabled:opacity-50"
                >
                  <span className="font-medium">{u.name ?? u.email}</span>
                  {u.name && <span className="text-xs text-gray-400">{u.email}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current shares */}
        {shares.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Shared with</p>
            {shares.map((share) => {
              const user = allUsers.find((u) => u.id === share.userId)
              return (
                <div key={share.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm">{user?.name ?? user?.email ?? share.userId}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={share.permission}
                      onChange={(e) => changePermission(share.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white"
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="EDITOR">Editor</option>
                    </select>
                    <button
                      onClick={() => removeShare(share.id)}
                      className="text-gray-300 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">Not shared with anyone yet</p>
        )}
      </div>
    </Modal>
  )
}
