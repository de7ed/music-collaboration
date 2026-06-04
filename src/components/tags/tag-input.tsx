"use client"

import { useState, useEffect, useRef } from "react"
import { Plus } from "lucide-react"

export function TagInput({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string }>>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    const controller = new AbortController()
    fetch(`/api/tags?q=${encodeURIComponent(value)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then(setSuggestions)
      .catch(() => {})
    return () => controller.abort()
  }, [value])

  async function handleAdd(name: string) {
    const normalized = name.toLowerCase().trim()
    if (!normalized) return
    await onAdd(normalized)
    setValue("")
    setSuggestions([])
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Plus className="w-3 h-3" />
        tag
      </button>
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd(value)
          if (e.key === "Escape") {
            setValue("")
            setOpen(false)
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            setValue("")
            setOpen(false)
          }, 150)
        }}
        placeholder="Add tag..."
        className="text-xs border border-gray-300 rounded px-2 py-0.5 w-24 outline-none focus:border-black"
      />
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-sm z-10">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onMouseDown={() => handleAdd(s.name)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
