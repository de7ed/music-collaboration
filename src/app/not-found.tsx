import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-sm text-gray-500">
          This page doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/lyric-sheets" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Go to Lyric Sheets
        </Link>
      </div>
    </div>
  )
}
