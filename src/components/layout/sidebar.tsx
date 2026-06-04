"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Music, Settings, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/lyric-sheets", label: "Lyric Sheets", icon: FileText },
  { href: "/music-sheets", label: "Music Sheets", icon: Music },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()

  const items = isAdmin
    ? [...navItems, { href: "/admin/users", label: "Admin", icon: ShieldCheck }]
    : navItems

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="px-4 py-5 border-b border-gray-200">
        <span className="font-bold text-sm tracking-tight">Music Collab</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-200"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
