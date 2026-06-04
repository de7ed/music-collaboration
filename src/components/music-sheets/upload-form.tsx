"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatBytes } from "@/lib/utils"

type LyricSheet = { id: string; title: string }

export function MusicSheetUploadForm({ lyricSheets }: { lyricSheets: LyricSheet[] }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [lyricSheetId, setLyricSheetId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim()) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title.trim())
      if (lyricSheetId) formData.append("lyricSheetId", lyricSheetId)

      const res = await fetch("/api/music-sheets", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const sheet = await res.json()
        router.push(`/music-sheets/${sheet.id}`)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g. Piano arrangement, Guitar tab..."
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>File</Label>
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-gray-300 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-6 h-6 mx-auto text-gray-300" />
              <p className="text-sm text-gray-400">Click to upload PDF or other file</p>
              <p className="text-xs text-gray-300">PDF, PNG, JPG up to 50MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.musicxml,.mxl"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {lyricSheets.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="lyric-sheet">Link to lyric sheet (optional)</Label>
          <select
            id="lyric-sheet"
            value={lyricSheetId}
            onChange={(e) => setLyricSheetId(e.target.value)}
            className="w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white"
          >
            <option value="">Not linked</option>
            {lyricSheets.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" disabled={!file || !title.trim() || uploading} className="w-full">
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </form>
  )
}
