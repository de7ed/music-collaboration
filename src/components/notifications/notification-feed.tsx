"use client"

import Link from "next/link"
import { useNotifications } from "@/context/notification-context"
import { formatDistanceToNow } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function notifText(type: string, payload: Record<string, unknown>): string {
  const actor = (payload.actorName as string) ?? "Someone"
  switch (type) {
    case "MENTIONED_IN_COMMENT":    return `${actor} mentioned you in a comment`
    case "NEW_COMMENT_ON_OWNED":    return `${actor} commented on your sheet`
    case "NEW_COMMENT_ON_SHARED":   return `${actor} commented on a sheet shared with you`
    case "NEW_COMMENT_ON_PUBLIC":   return `${actor} commented on a public sheet`
    case "ACCOUNT_APPROVED":        return "Your account has been approved"
    case "ACCOUNT_REJECTED":        return "Your account request was not approved"
    case "INVITE_ACCEPTED":         return `${actor} accepted your invite`
    default:                        return type
  }
}

function notifHref(payload: Record<string, unknown>): string | null {
  if (payload.lyricSheetId) return `/lyric-sheets/${payload.lyricSheetId}`
  if (payload.musicSheetId) return `/music-sheets/${payload.musicSheetId}`
  return null
}

export function NotificationFeed() {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  async function handleMarkAllRead() {
    markAllRead() // optimistic UI update
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    })
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium">Notifications</span>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-0.5 px-2 text-xs"
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
        ) : (
          notifications.map((n) => {
            const payload = n.payload as Record<string, unknown>
            const href = notifHref(payload)
            const content = (
              <div className={`px-4 py-3 transition-colors ${!n.readAt ? "bg-gray-50" : "hover:bg-gray-50"}`}>
                <p className="text-sm leading-snug">{notifText(n.type, payload)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(n.createdAt))}
                </p>
              </div>
            )
            return href ? (
              <Link key={n.id} href={href}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            )
          })
        )}
      </div>
    </div>
  )
}
