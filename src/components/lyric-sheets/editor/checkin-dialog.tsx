"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function CheckInDialog({
  open,
  onClose,
  sheetId,
  currentContent,
}: {
  open: boolean
  onClose: () => void
  sheetId: string
  currentContent: object
}) {
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleCheckIn() {
    if (!message.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/lyric-sheets/${sheetId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent, message: message.trim() }),
      })
      setMessage("")
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Check in version">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="checkin-message">Describe what changed</Label>
          <Input
            id="checkin-message"
            autoFocus
            placeholder="e.g. Updated chorus, added bridge..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCheckIn} disabled={!message.trim() || saving}>
            {saving ? "Saving..." : "Check in"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
