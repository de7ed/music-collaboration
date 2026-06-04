"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AtSign, MessageSquare, Globe, UserCheck, UserX, Mail, Bell
} from "lucide-react"
import { useNotifications, type NotificationItem } from "@/context/notification-context"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "@/lib/utils"

// ── Helpers ───────────────────────────────────────────────────

type Payload = Record<string, unknown>

function notifIcon(type: string) {
  const cls = "w-4 h-4 shrink-0"
  switch (type) {
    case "MENTIONED_IN_COMMENT":   return <AtSign className={cls} />
    case "NEW_COMMENT_ON_OWNED":   return <MessageSquare className={cls} />
    case "NEW_COMMENT_ON_SHARED":  return <MessageSquare className={cls} />
    case "NEW_COMMENT_ON_PUBLIC":  return <Globe className={cls} />
    case "ACCOUNT_APPROVED":       return <UserCheck className={cls} />
    case "ACCOUNT_REJECTED":       return <UserX className={cls} />
    case "INVITE_ACCEPTED":        return <Mail className={cls} />
    default:                       return <Bell className={cls} />
  }
}

function notifText(type: string, payload: Payload): string {
  const actor = (payload.actorName as string) ?? "Someone"
  switch (type) {
    case "MENTIONED_IN_COMMENT":   return `${actor} mentioned you in a comment`
    case "NEW_COMMENT_ON_OWNED":   return `${actor} commented on your sheet`
    case "NEW_COMMENT_ON_SHARED":  return `${actor} commented on a sheet shared with you`
    case "NEW_COMMENT_ON_PUBLIC":  return `${actor} commented on a public sheet`
    case "ACCOUNT_APPROVED":       return "Your account has been approved"
    case "ACCOUNT_REJECTED":       return "Your account request was not approved"
    case "INVITE_ACCEPTED":        return `${actor} accepted your invite`
    default:                       return type
  }
}

function notifHref(payload: Payload): string | null {
  if (payload.lyricSheetId) return `/lyric-sheets/${payload.lyricSheetId}`
  if (payload.musicSheetId) return `/music-sheets/${payload.musicSheetId}`
  return null
}

function notifSheetLabel(payload: Payload): string | null {
  if (payload.sheetTitle) return payload.sheetTitle as string
  return null
}

// ── Row component ─────────────────────────────────────────────

function NotifRow({
  notif,
  onMarkRead,
}: {
  notif: NotificationItem
  onMarkRead: (id: string) => void
}) {
  const payload = notif.payload
  const href = notifHref(payload)
  const sheetLabel = notifSheetLabel(payload)
  const isUnread = !notif.readAt

  async function handleMarkRead(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onMarkRead(notif.id)
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [notif.id], action: "markRead" }),
    })
  }

  const inner = (
    <div
      className={`group flex items-start gap-3 px-5 py-4 border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50 ${
        isUnread ? "bg-gray-50/80" : ""
      }`}
    >
      {/* Unread dot */}
      <div className="mt-0.5 w-2 shrink-0">
        {isUnread && <div className="w-2 h-2 rounded-full bg-black mt-1" />}
      </div>

      {/* Icon */}
      <div className={`mt-0.5 shrink-0 ${isUnread ? "text-black" : "text-gray-400"}`}>
        {notifIcon(notif.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={`text-sm leading-snug ${isUnread ? "font-medium" : "text-gray-600"}`}>
          {notifText(notif.type, payload)}
        </p>
        {sheetLabel && (
          <p className="text-xs text-gray-400 truncate">{sheetLabel}</p>
        )}
        <p className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(notif.createdAt))}
        </p>
      </div>

      {/* Mark as read — appears on hover if unread */}
      {isUnread && (
        <button
          onClick={handleMarkRead}
          className="shrink-0 text-xs text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
          title="Mark as read"
        >
          Mark read
        </button>
      )}
    </div>
  )

  return href ? (
    <Link href={href} onClick={() => isUnread && onMarkRead(notif.id)}>
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  )
}

// ── Main feed page ────────────────────────────────────────────

type Filter = "all" | "unread"

export function NotificationFeedPage() {
  const { notifications, unreadCount, markOneRead, markAllRead } = useNotifications()
  const [filter, setFilter] = useState<Filter>("all")

  const visible = filter === "unread"
    ? notifications.filter((n) => !n.readAt)
    : notifications

  async function handleMarkAllRead() {
    markAllRead()
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    })
  }

  function handleMarkOneRead(id: string) {
    markOneRead(id)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold">Feed</h1>
          {unreadCount > 0 && (
            <span className="text-sm text-gray-400">{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-100 pb-0">
        {(["all", "unread"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              filter === f
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {f === "all" ? "All" : "Unread"}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-xs bg-black text-white rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {visible.map((n) => (
            <NotifRow key={n.id} notif={n} onMarkRead={handleMarkOneRead} />
          ))}
        </div>
      )}
    </div>
  )
}
