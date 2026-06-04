"use client"

import { useState, useCallback } from "react"
import { Rss, FileText, Music, Settings, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

const ALL_ITEMS = [
  { key: "/feed",         label: "Feed",         icon: Rss      },
  { key: "/lyric-sheets", label: "Lyric Sheets", icon: FileText },
  { key: "/music-sheets", label: "Music Sheets", icon: Music    },
  { key: "/settings",     label: "Settings",     icon: Settings },
]

type Prefs = { order: string[]; hidden: string[] }

function applyPrefs(prefs: Prefs | null): (typeof ALL_ITEMS[number] & { hidden: boolean })[] {
  const order = prefs?.order ?? ALL_ITEMS.map((i) => i.key)
  const hidden = new Set(prefs?.hidden ?? [])
  const sorted = [...order]
    .map((key) => ALL_ITEMS.find((i) => i.key === key))
    .filter(Boolean) as typeof ALL_ITEMS
  ALL_ITEMS.forEach((item) => {
    if (!sorted.some((s) => s.key === item.key)) sorted.push(item)
  })
  return sorted.map((item) => ({ ...item, hidden: hidden.has(item.key) }))
}

export function SidebarCustomizer({
  initialPrefs,
  isAdmin,
}: {
  initialPrefs: Prefs | null
  isAdmin: boolean
}) {
  const [items, setItems] = useState(() => applyPrefs(initialPrefs))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const move = useCallback((index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev]
      const swap = index + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[index], next[swap]] = [next[swap], next[index]]
      return next
    })
    setSaved(false)
  }, [])

  const toggleHidden = useCallback((key: string) => {
    setItems((prev) => prev.map((item) => item.key === key ? { ...item, hidden: !item.hidden } : item))
    setSaved(false)
  }, [])

  async function save() {
    setSaving(true)
    try {
      await fetch("/api/user/sidebar-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: items.map((i) => i.key),
          hidden: items.filter((i) => i.hidden).map((i) => i.key),
        }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <p className="text-xs text-gray-400 px-4 pt-3 pb-1">
        Drag to reorder, or use the arrows. Hide items you don&apos;t use.
        {isAdmin && " The Admin section always appears at the bottom for admin accounts."}
      </p>
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 px-4 py-2.5 ${item.hidden ? "opacity-40" : ""}`}
            >
              <Icon className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="flex-1 text-sm">{item.label}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleHidden(item.key)}
                  className="p-1 rounded text-gray-300 hover:text-gray-600 transition-colors"
                  title={item.hidden ? "Show in sidebar" : "Hide from sidebar"}
                >
                  {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {saved && <span className="text-xs text-gray-400">Saved</span>}
      </div>
    </div>
  )
}
