"use client"

import { useState } from "react"
import { Link2, Copy, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

export function ShareLinkButton({ sheetId }: { sheetId: string }) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = token
    ? `${window.location.origin}/share/${token}`
    : null

  async function openModal() {
    setOpen(true)
    setLoading(true)
    try {
      // Check if a link already exists
      const res = await fetch(`/api/lyric-sheets/${sheetId}/share-link`)
      if (res.ok) {
        const data = await res.json()
        setToken(data?.token ?? null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/lyric-sheets/${sheetId}/share-link`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
      }
    } finally {
      setLoading(false)
    }
  }

  async function revoke() {
    setLoading(true)
    try {
      await fetch(`/api/lyric-sheets/${sheetId}/share-link`, { method: "DELETE" })
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={openModal}>
        <Link2 className="w-3.5 h-3.5 mr-1" />
        Share link
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Public share link">
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : token ? (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Anyone with this link can view the lyrics and comments without signing in.
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareUrl ?? ""}
                    className="flex-1 text-xs border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 font-mono truncate"
                  />
                  <Button size="sm" variant="outline" onClick={copy}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <p className="text-xs text-gray-400">Revoke to disable this link</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={revoke}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Revoke
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Generate a public link so anyone can view this sheet without an account.
                Comments remain read-only for non-members.
              </p>
              <Button onClick={generate} disabled={loading} className="w-full">
                <Link2 className="w-4 h-4 mr-2" />
                Generate share link
              </Button>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
