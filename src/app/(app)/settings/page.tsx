import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { InviteForm } from "@/components/settings/invite-form"
import { DisplayNameForm } from "@/components/settings/display-name-form"

export default async function SettingsPage() {
  const user = await requireAuth()

  const invites = await prisma.invite.findMany({
    where: { invitedById: user.id },
    orderBy: { createdAt: "desc" },
  })

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
        <div className="border border-gray-200 rounded-lg p-4">
          <Link href="/settings/notifications" className="text-sm hover:underline underline-offset-2">
            Configure notification preferences
          </Link>
        </div>
      </section>

      {/* Admin */}
      {user.role === "ADMIN" && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Admin</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <Link href="/admin/users" className="text-sm hover:underline underline-offset-2">
              Manage users
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
