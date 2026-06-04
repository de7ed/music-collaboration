"use client"

import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered } from "lucide-react"
import { cn } from "@/lib/utils"

const SECTION_LABELS = ["Verse", "Chorus", "Bridge", "Pre-Chorus", "Outro", "Intro", "Hook"]

export function EditorToolbar({ editor }: { editor: ReturnType<typeof import("@tiptap/react").useEditor> }) {
  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded transition-colors text-sm",
        active ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
      )}
    >
      {children}
    </button>
  )

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Bold", <Bold className="w-3.5 h-3.5" />)}
      {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italic", <Italic className="w-3.5 h-3.5" />)}
      {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "Underline", <UnderlineIcon className="w-3.5 h-3.5" />)}

      <div className="w-px h-4 bg-gray-200 mx-1" />

      {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Bullet list", <List className="w-3.5 h-3.5" />)}
      {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Numbered list", <ListOrdered className="w-3.5 h-3.5" />)}

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <select
        className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white"
        defaultValue=""
        onChange={(e) => {
          const label = e.target.value
          if (label) {
            editor.chain().focus().insertContent(`\n[${label}]\n`).run()
            e.target.value = ""
          }
        }}
      >
        <option value="" disabled>
          Add section...
        </option>
        {SECTION_LABELS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </div>
  )
}
