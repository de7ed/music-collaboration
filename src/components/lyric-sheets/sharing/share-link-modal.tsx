"use client"

import { useState, useEffect } from "react"
import { Copy, Trash2, Check, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

export function ShareLinkModal({
  open,
  onClose,
  sheetId,
  sheetType = "lyric",
}: {
  open: boolean
  onClose: () => void
  sheetId: string
  sheetType?: "lyric" | "tab"
}) {
  const base = sheetType === "tab" ? `/api/tab-sheets/${sheetId}` : `/api/lyric-sheets/${sheetId}`
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}`
    : null

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`${base}/share-link`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setToken(data?.token ?? null))
      .finally(() => setLoading(false))
  }, [open, base])

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch(`${base}/share-link`, { method: "POST" })
      if (res.ok) setToken((await res.json()).token)
    } finally {
      setLoading(false)
    }
  }

  async function revoke() {
    setLoading(true)
    try {
      await fetch(`${base}/share-link`, { method: "DELETE" })
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
    <Modal open={open} onClose={onClose} title="Public share link">
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : token ? (
          <>
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Anyone with this link can view the sheet without signing in.
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
              <Button size="sm" variant="ghost" onClick={revoke} className="text-gray-400 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Revoke
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Generate a public link so anyone can view this sheet without an account.
            </p>
            <Button onClick={generate} disabled={loading} className="w-full">
              <Link2 className="w-4 h-4 mr-2" />
              Generate share link
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
