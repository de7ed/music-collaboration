"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { useNotifications } from "@/context/notification-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationFeed } from "./notification-feed"

export function NotificationBell() {
  const { unreadCount } = useNotifications()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative p-2 rounded-md hover:bg-gray-100 transition-colors outline-none">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <NotificationFeed />
        <Link
          href="/feed"
          className="block text-center text-xs text-gray-400 hover:text-gray-600 py-2.5 border-t border-gray-100 transition-colors"
        >
          View all in Feed →
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
