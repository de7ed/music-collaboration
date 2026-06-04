"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  const suggestions = allUsers.filter(
    (u) =>
      !sharedUserIds.has(u.id) &&
      (u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()))
  )

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
    if (res.ok) {
      setShares((prev) => prev.filter((s) => s.id !== shareId))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share sheet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Input
              placeholder="Search users to add..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && suggestions.length > 0 && (
              <div className="border border-gray-200 rounded-md overflow-hidden">
                {suggestions.slice(0, 5).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => addShare(u.id)}
                    disabled={loading === u.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{u.name ?? u.email}</span>
                    <span className="text-xs text-gray-400">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {shares.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shared with</p>
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
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
