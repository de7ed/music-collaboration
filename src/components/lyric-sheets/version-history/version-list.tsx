"use client"

import { useState } from "react"
import { GitCommitHorizontal, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "@/lib/utils"
import { useRouter } from "next/navigation"

type Version = {
  id: string
  isCheckIn: boolean
  message: string | null
  createdById: string
  createdAt: string
}

export function VersionHistory({
  versions,
  sheetId,
  isOwner,
  currentUserId,
}: {
  versions: Version[]
  sheetId: string
  isOwner: boolean
  currentUserId: string
}) {
  const router = useRouter()
  const [reverting, setReverting] = useState<string | null>(null)
  const [showAutosaves, setShowAutosaves] = useState(false)

  const checkIns = versions.filter((v) => v.isCheckIn)
  const autosaves = versions.filter((v) => !v.isCheckIn)

  async function revert(versionId: string) {
    setReverting(versionId)
    try {
      const res = await fetch(`/api/lyric-sheets/${sheetId}/versions/${versionId}/revert`, {
        method: "POST",
      })
      if (res.ok) {
        router.push(`/lyric-sheets/${sheetId}`)
      }
    } finally {
      setReverting(null)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Check-ins ({checkIns.length})
        </h2>
        {checkIns.length === 0 ? (
          <p className="text-sm text-gray-400">No check-ins yet</p>
        ) : (
          <div className="space-y-2">
            {checkIns.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <GitCommitHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{v.message ?? "No message"}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(v.createdAt))}
                    </p>
                  </div>
                </div>
                {isOwner && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => revert(v.id)}
                    disabled={reverting === v.id}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Revert
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {autosaves.length > 0 && (
        <section>
          <button
            onClick={() => setShowAutosaves(!showAutosaves)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showAutosaves ? "Hide" : "Show"} autosaved draft ({autosaves.length})
          </button>
          {showAutosaves && (
            <div className="mt-2 space-y-2">
              {autosaves.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="text-sm text-gray-500">Autosave</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(v.createdAt))}
                    </p>
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => revert(v.id)}
                      disabled={reverting === v.id}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
