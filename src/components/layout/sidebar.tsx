"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Rss, FileText, Music, Settings, Menu, X, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/context/notification-context"

type NavItemDef = { href: string; label: string; icon: React.ElementType }

const DEFAULT_ITEMS: NavItemDef[] = [
  { href: "/feed",         label: "Feed",         icon: Rss      },
  { href: "/lyric-sheets", label: "Lyric Sheets", icon: FileText },
  { href: "/music-sheets", label: "Music Sheets", icon: Music    },
  { href: "/settings",     label: "Settings",     icon: Settings },
]

type SidebarPrefs = { order: string[]; hidden: string[] } | null

type EditableItem = NavItemDef & { hidden: boolean }

function buildEditableItems(prefs: SidebarPrefs): EditableItem[] {
  const hidden = new Set(prefs?.hidden ?? [])
  const order = prefs?.order ?? DEFAULT_ITEMS.map((i) => i.href)
  const sorted = order
    .map((key) => DEFAULT_ITEMS.find((i) => i.href === key))
    .filter((i): i is NavItemDef => !!i)
  DEFAULT_ITEMS.forEach((item) => {
    if (!sorted.some((s) => s.href === item.href)) sorted.push(item)
  })
  return sorted.map((item) => ({ ...item, hidden: hidden.has(item.href) }))
}

function buildVisibleItems(items: EditableItem[]): NavItemDef[] {
  return items.filter((i) => !i.hidden)
}

async function savePrefs(items: EditableItem[]) {
  await fetch("/api/user/sidebar-preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order: items.map((i) => i.href),
      hidden: items.filter((i) => i.hidden).map((i) => i.href),
    }),
  })
}

function NavLinks({
  isAdmin: _isAdmin,
  prefs,
  onNavigate,
}: {
  isAdmin: boolean
  prefs: SidebarPrefs
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { unreadCount } = useNotifications()

  const [editing, setEditing] = useState(false)
  const [items, setItems] = useState<EditableItem[]>(() => buildEditableItems(prefs))
  const [saving, setSaving] = useState(false)

  const visibleItems = buildVisibleItems(items)

  const move = useCallback((index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev]
      const swap = index + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[index], next[swap]] = [next[swap], next[index]]
      return next
    })
  }, [])

  const toggleHidden = useCallback((href: string) => {
    setItems((prev) => prev.map((item) => item.href === href ? { ...item, hidden: !item.hidden } : item))
  }, [])

  async function finishEditing() {
    setSaving(true)
    await savePrefs(items)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  return (
    <nav className="flex-1 px-2 py-4 flex flex-col space-y-0.5">
      {editing ? (
        // Edit mode: show all items with reorder + hide controls
        <>
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={item.href}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-md text-sm",
                  item.hidden ? "opacity-40" : "text-gray-700"
                )}
              >
                <Icon className="w-4 h-4 shrink-0 text-gray-400" />
                <span className="flex-1 text-sm">{item.label}</span>
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleHidden(item.href)}
                  className="p-0.5 text-gray-300 hover:text-gray-600"
                  title={item.hidden ? "Show" : "Hide"}
                >
                  {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            )
          })}
          <div className="pt-2 border-t border-gray-200 mt-1">
            <button
              onClick={finishEditing}
              disabled={saving}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Done"}
            </button>
          </div>
        </>
      ) : (
        // Normal mode
        <>
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            const showBadge = href === "/feed" && unreadCount > 0
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className={cn(
                    "text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none",
                    isActive ? "bg-white text-black" : "bg-black text-white"
                  )}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
          <div className="pt-2 mt-auto border-t border-gray-200">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Customize sidebar
            </button>
          </div>
        </>
      )}
    </nav>
  )
}

export function Sidebar({
  isAdmin = false,
  sidebarPrefs = null,
}: {
  isAdmin?: boolean
  sidebarPrefs?: SidebarPrefs
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-1.5 rounded-md bg-white border border-gray-200 shadow-sm"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "md:hidden fixed inset-y-0 left-0 z-50 w-56 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          <span className="font-bold text-sm tracking-tight">Riff Session</span>
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <NavLinks isAdmin={isAdmin} prefs={sidebarPrefs} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-gray-200 bg-gray-50 flex-col h-full">
        <div className="px-4 py-5 border-b border-gray-200">
          <span className="font-bold text-sm tracking-tight">Riff Session</span>
        </div>
        <NavLinks isAdmin={isAdmin} prefs={sidebarPrefs} />
      </aside>
    </>
  )
}
