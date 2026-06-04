"use client"

import { createContext, useContext, useState, useCallback } from "react"

export interface NotificationItem {
  id: string
  type: string
  readAt: string | null
  payload: Record<string, unknown>
  createdAt: string
}

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  addNotification: (n: NotificationItem) => void
  markOneRead: (id: string) => void
  markAllRead: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markOneRead: () => {},
  markAllRead: () => {},
})

export function NotificationProvider({
  children,
  initialNotifications = [],
}: {
  children: React.ReactNode
  initialNotifications?: NotificationItem[]
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)

  const addNotification = useCallback((n: NotificationItem) => {
    setNotifications((prev) => [n, ...prev])
  }, [])

  const markOneRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n))
    )
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    )
  }, [])

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markOneRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
