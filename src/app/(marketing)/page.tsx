import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  return (
    <div className="w-full max-w-md space-y-10 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Music Collab</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          A private workspace for bands and collaborators to write, share, and
          refine lyrics and sheet music together.
        </p>
      </div>

      <div className="space-y-3">
        <Link href="/sign-up" className={cn(buttonVariants(), "w-full")}>
          Request access
        </Link>
        <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
          Sign in
        </Link>
      </div>

      <p className="text-xs text-gray-400">
        This is a private platform.{" "}
        <a
          href="mailto:david.barron@nrg.com"
          className="underline underline-offset-2"
        >
          Contact the admin
        </a>{" "}
        if you&apos;d like access.
      </p>
    </div>
  )
}
