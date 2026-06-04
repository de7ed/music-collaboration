"use client"

import { useNotifications } from "@/context/notification-context"
import { formatDistanceToNow } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const notifLabels: Record<string, string> = {
  MENTIONED_IN_COMMENT: "mentioned you",
  NEW_COMMENT_ON_OWNED: "commented on your sheet",
  NEW_COMMENT_ON_SHARED: "commented on a shared sheet",
  NEW_COMMENT_ON_PUBLIC: "commented on a public sheet",
  ACCOUNT_APPROVED: "Your account was approved",
  ACCOUNT_REJECTED: "Your account request was rejected",
  INVITE_ACCEPTED: "accepted your invite",
}

export function NotificationFeed() {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium">Notifications</span>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="h-auto py-0.5 px-2 text-xs" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.readAt ? "bg-gray-50" : ""}`}
            >
              <p className="text-sm">{notifLabels[n.type] ?? n.type}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDistanceToNow(new Date(n.createdAt))}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
