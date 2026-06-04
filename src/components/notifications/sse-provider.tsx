"use client"

import { useEffect } from "react"
import { useNotifications } from "@/context/notification-context"

export function SSEProvider() {
  const { addNotification } = useNotifications()

  useEffect(() => {
    const es = new EventSource("/api/notifications/stream")

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.notification) addNotification(data.notification)
      } catch {
        // ignore malformed events
      }
    }

    return () => es.close()
  }, [addNotification])

  return null
}
