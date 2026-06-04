"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type Prefs = {
  inAppMentioned: boolean
  inAppNewCommentOwned: boolean
  inAppNewCommentShared: boolean
  inAppNewCommentPublic: boolean
  emailMentioned: boolean
  emailNewCommentOwned: boolean
  emailNewCommentShared: boolean
  emailNewCommentPublic: boolean
}

const rows = [
  { key: "Mentioned", inApp: "inAppMentioned" as keyof Prefs, email: "emailMentioned" as keyof Prefs, label: "Someone @mentions you" },
  { key: "CommentOwned", inApp: "inAppNewCommentOwned" as keyof Prefs, email: "emailNewCommentOwned" as keyof Prefs, label: "New comment on your sheet" },
  { key: "CommentShared", inApp: "inAppNewCommentShared" as keyof Prefs, email: "emailNewCommentShared" as keyof Prefs, label: "New comment on a shared sheet" },
  { key: "CommentPublic", inApp: "inAppNewCommentPublic" as keyof Prefs, email: "emailNewCommentPublic" as keyof Prefs, label: "New comment on any public sheet" },
]

export function NotificationPreferencesForm({ initialPrefs }: { initialPrefs: Prefs }) {
  const [prefs, setPrefs] = useState(initialPrefs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(key: keyof Prefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    try {
      await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-500">Event</span>
          <span className="text-xs font-medium text-gray-500 text-center">In-app</span>
          <span className="text-xs font-medium text-gray-500 text-center">Email</span>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-3 px-4 py-3 border-b border-gray-100 last:border-0 items-center">
            <span className="text-sm">{row.label}</span>
            <div className="flex justify-center">
              <Toggle checked={prefs[row.inApp]} onChange={() => toggle(row.inApp)} />
            </div>
            <div className="flex justify-center">
              <Toggle checked={prefs[row.email]} onChange={() => toggle(row.email)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save preferences"}
        </Button>
        {saved && <span className="text-xs text-gray-400">Saved</span>}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-black" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  )
}
