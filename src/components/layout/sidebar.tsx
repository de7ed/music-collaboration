"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Rss, FileText, Music, Settings, ShieldCheck, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/context/notification-context"

const navItems = [
  { href: "/feed",         label: "Feed",         icon: Rss      },
  { href: "/lyric-sheets", label: "Lyric Sheets", icon: FileText },
  { href: "/music-sheets", label: "Music Sheets", icon: Music    },
  { href: "/settings",     label: "Settings",     icon: Settings },
]

function NavLinks({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

  const items = isAdmin
    ? [...navItems, { href: "/admin/users", label: "Admin", icon: ShieldCheck }]
    : navItems

  return (
    <nav className="flex-1 px-2 py-4 space-y-0.5">
      {items.map(({ href, label, icon: Icon }) => {
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
    </nav>
  )
}

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
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
        <NavLinks isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-gray-200 bg-gray-50 flex-col h-full">
        <div className="px-4 py-5 border-b border-gray-200">
          <span className="font-bold text-sm tracking-tight">Riff Session</span>
        </div>
        <NavLinks isAdmin={isAdmin} />
      </aside>
    </>
  )
}
