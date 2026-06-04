import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences"

export default async function NotificationSettingsPage() {
  const user = await requireAuth()

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  })

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification preferences</h1>
        <p className="text-sm text-gray-500 mt-1">Choose how and when you receive notifications</p>
      </div>
      <NotificationPreferencesForm initialPrefs={prefs} />
    </div>
  )
}
