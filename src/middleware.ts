import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pending",
  "/share(.*)",
  "/api/webhooks/clerk",
])

const isAdminRoute = createRouteMatcher(["/admin(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Allow public routes through
  if (isPublicRoute(req)) return NextResponse.next()

  // Require authentication
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Get user metadata from session claims (includes publicMetadata from JWT)
  const publicMetadata = sessionClaims?.public_metadata as { status?: string; role?: string } | undefined

  // If metadata is missing (rare race condition), allow through to let Clerk sync
  if (!publicMetadata?.status) {
    return NextResponse.next()
  }

  // Check user status
  if (publicMetadata.status === "pending" || publicMetadata.status === "rejected" || publicMetadata.status === "suspended") {
    if (req.nextUrl.pathname !== "/pending") {
      return NextResponse.redirect(new URL("/pending", req.url))
    }
    return NextResponse.next()
  }

  // Admin route guard
  if (isAdminRoute(req) && publicMetadata.role !== "admin") {
    return NextResponse.redirect(new URL("/lyric-sheets", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
}
