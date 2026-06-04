import fs from "fs/promises"
import path from "path"
import type { StorageProvider } from "./index"

const UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads")

export class LocalStorage implements StorageProvider {
  async upload(key: string, buffer: Buffer, _mime: string): Promise<string> {
    const filePath = path.join(UPLOADS_DIR, key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, buffer)
    return key
  }

  async getUrl(key: string): Promise<string> {
    return `/api/files/${key}`
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, key)
    await fs.rm(filePath, { force: true })
  }
}
