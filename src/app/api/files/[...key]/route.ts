import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import fs from "fs/promises"
import path from "path"

// Dev-only local file serving. Never exposed in production (use S3 presigned URLs instead).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  if (process.env.STORAGE_PROVIDER === "s3") {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }

  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { key } = await params
  const filePath = path.join(process.cwd(), "storage", "uploads", ...key)

  try {
    const buffer = await fs.readFile(filePath)
    const ext = key[key.length - 1].split(".").pop() ?? ""
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
    }
    const contentType = mimeTypes[ext] ?? "application/octet-stream"

    return new Response(buffer, { headers: { "Content-Type": contentType } })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
