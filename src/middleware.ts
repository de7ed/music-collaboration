import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pending",
  "/api/webhooks/clerk",
])

const isAdminRoute = createRouteMatcher(["/admin(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Allow public routes through
  if (isPublicRoute(req)) return NextResponse.next()

  // Require authentication
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Fetch user's public metadata directly from Clerk (always fresh, no JWT caching)
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const meta = clerkUser.publicMetadata as { status?: string; role?: string }

  if (!meta.status || meta.status === "pending" || meta.status === "rejected" || meta.status === "suspended") {
    if (req.nextUrl.pathname !== "/pending") {
      return NextResponse.redirect(new URL("/pending", req.url))
    }
    return NextResponse.next()
  }

  // Admin route guard
  if (isAdminRoute(req) && meta.role !== "admin") {
    return NextResponse.redirect(new URL("/lyric-sheets", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
}
