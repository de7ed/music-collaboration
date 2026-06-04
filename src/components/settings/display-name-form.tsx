"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function DisplayNameForm({ initialName }: { initialName: string | null }) {
  const [name, setName] = useState(initialName ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Display name</Label>
        <p className="text-xs text-gray-400">
          Shown to collaborators on sheets, comments, and notifications.
        </p>
        <div className="flex gap-2">
          <Input
            id="display-name"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false) }}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Your name"
            className="flex-1"
          />
          <Button
            onClick={save}
            disabled={saving || name.trim() === (initialName ?? "")}
            size="sm"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      {saved && <p className="text-xs text-gray-400">Saved ✓</p>}
    </div>
  )
}
