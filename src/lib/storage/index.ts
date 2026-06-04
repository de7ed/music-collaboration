export interface StorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>
  getUrl(key: string): Promise<string>
  delete(key: string): Promise<void>
}

let _provider: StorageProvider | null = null

export async function getStorage(): Promise<StorageProvider> {
  if (_provider) return _provider
  if (process.env.STORAGE_PROVIDER === "s3") {
    const { S3Storage } = await import("./s3")
    _provider = new S3Storage()
  } else {
    const { LocalStorage } = await import("./local")
    _provider = new LocalStorage()
  }
  return _provider
}
