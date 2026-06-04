import { useEffect, useRef, useState } from "react"

type SaveStatus = "saved" | "saving" | "unsaved" | "idle"

export function useAutosave({
  sheetId,
  sheetType = "lyric-sheets",
  content,
  enabled,
  delay = 2000,
}: {
  sheetId: string
  /** The API route segment for the sheet type, e.g. "lyric-sheets" or "tab-sheets". */
  sheetType?: string
  content: object | null
  enabled: boolean
  delay?: number
}) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(content)

  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    if (!enabled || !content) return

    setStatus("unsaved")

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setStatus("saving")
      try {
        await fetch(`/api/${sheetType}/${sheetId}/autosave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })
        setStatus("saved")
      } catch {
        setStatus("unsaved")
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, sheetId, sheetType, enabled, delay])

  return status
}
