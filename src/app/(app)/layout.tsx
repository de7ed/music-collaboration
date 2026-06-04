import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/layout/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { SSEProvider } from "@/components/notifications/sse-provider"
import { NotificationProvider } from "@/context/notification-context"
import { UserButton } from "@clerk/nextjs"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  let user = await prisma.user.findUnique({ where: { clerkId: userId } })

  // Fallback: if the webhook hasn't fired yet (common in local dev), create the
  // user row now as PENDING so they land on the approval queue rather than an error.
  if (!user) {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ""
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        name,
        avatarUrl: clerkUser.imageUrl || null,
        status: "PENDING",
        role: "STANDARD",
      },
    })
  }

  if (user.status !== "ACTIVE") redirect("/pending")

  const recentNotifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <NotificationProvider initialNotifications={recentNotifications.map((n: { id: string; type: string; readAt: Date | null; payload: unknown; createdAt: Date; userId: string }) => ({
      ...n,
      type: n.type as string,
      readAt: n.readAt?.toISOString() ?? null,
      payload: n.payload as Record<string, unknown>,
      createdAt: n.createdAt.toISOString(),
    }))}>
      <SSEProvider />
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar isAdmin={user.role === "ADMIN"} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-12 border-b border-gray-200 flex items-center justify-end pl-12 pr-4 md:pl-4 gap-2 shrink-0">
            <NotificationBell />
            <UserButton />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </NotificationProvider>
  )
}
