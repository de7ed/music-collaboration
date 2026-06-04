"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check in version</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="checkin-message">Message</Label>
            <Input
              id="checkin-message"
              autoFocus
              placeholder="Describe what changed..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCheckIn} disabled={!message.trim() || saving}>
            {saving ? "Saving..." : "Check in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
