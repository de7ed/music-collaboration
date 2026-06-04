import { requireAuth } from "@/lib/auth"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

export default async function SettingsPage() {
  const user = await requireAuth()

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Account</h2>
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <UserButton />
            <div>
              <p className="text-sm font-medium">{user.name ?? user.email}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Manage your profile, password, and connected accounts via the button above.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Notifications</h2>
        <div className="border border-gray-200 rounded-lg p-4">
          <Link
            href="/settings/notifications"
            className="text-sm text-black hover:underline underline-offset-2"
          >
            Configure notification preferences →
          </Link>
        </div>
      </section>

      {user.role === "ADMIN" && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Admin</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <Link
              href="/admin/users"
              className="text-sm text-black hover:underline underline-offset-2"
            >
              Manage users →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
