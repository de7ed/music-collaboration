import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserButton } from "@clerk/nextjs"
import { InviteForm } from "@/components/settings/invite-form"
import { DisplayNameForm } from "@/components/settings/display-name-form"
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences"
import { PendingUsersTable } from "@/components/admin/pending-users-table"
import { SidebarCustomizer } from "@/components/settings/sidebar-customizer"

export default async function SettingsPage() {
  const user = await requireAuth()

  const [invites, notifPrefs] = await Promise.all([
    prisma.invite.findMany({
      where: { invitedById: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    }),
  ])

  let pendingUsers: { id: string; email: string; name: string | null; createdAt: Date; invitedBy: { name: string | null; email: string } | null }[] = []
  let allUsers: { id: string; email: string; name: string | null; role: string; status: string; createdAt: Date }[] = []

  if (user.role === "ADMIN") {
    ;[pendingUsers, allUsers] = await Promise.all([
      prisma.user.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          invitedBy: { select: { name: true, email: true } },
        },
      }),
      prisma.user.findMany({
        where: { status: { not: "PENDING" } },
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
      }),
    ])
  }

  const sidebarPrefs = (user.sidebarPreferences ?? null) as { order: string[]; hidden: string[] } | null

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Account</h2>
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <DisplayNameForm initialName={user.name} />
        </div>
      </section>

      {/* Sidebar */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Sidebar</h2>
        <SidebarCustomizer initialPrefs={sidebarPrefs} isAdmin={user.role === "ADMIN"} />
      </section>

      {/* Invite collaborators */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Invite collaborators</h2>
          <p className="text-xs text-gray-400 mt-1">
            They will receive an email and their account will need admin approval before they can sign in.
          </p>
        </div>
        <InviteForm
          initialInvites={invites.map((i) => ({
            ...i,
            createdAt: i.createdAt.toISOString(),
            expiresAt: i.expiresAt.toISOString(),
          }))}
        />
      </section>

      {/* Notifications */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Notifications</h2>
        <NotificationPreferencesForm initialPrefs={notifPrefs} />
      </section>

      {/* Admin — only visible to admins */}
      {user.role === "ADMIN" && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">User Management</h2>
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium uppercase tracking-wide">Admin only</span>
          </div>
          <PendingUsersTable pendingUsers={pendingUsers} allUsers={allUsers} />
        </section>
      )}
    </div>
  )
}
