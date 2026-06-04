import { prisma } from "@/lib/prisma"
import { pushToUser } from "@/lib/sse/connections"
import { NotificationType } from "@prisma/client"

interface DispatchOptions {
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
}

export async function dispatch({ userId, type, payload }: DispatchOptions) {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } })

  const inAppKey = inAppPrefKey(type)
  const emailKey = emailPrefKey(type)

  const sendInApp = prefs ? (prefs[inAppKey] ?? true) : true
  const sendEmail = prefs ? (prefs[emailKey] ?? false) : false

  if (!sendInApp && !sendEmail) return

  const notification = await prisma.notification.create({
    data: { userId, type, payload: payload as object },
  })

  if (sendInApp) {
    pushToUser(userId, { notification })
  }

  if (sendEmail) {
    // Lazy import to avoid loading Resend on every request
    const { sendNotificationEmail } = await import("@/lib/email")
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.email) {
      await sendNotificationEmail({ to: user.email, type, payload })
    }
  }
}

function inAppPrefKey(type: NotificationType): keyof import("@prisma/client").NotificationPreference {
  const map: Partial<Record<NotificationType, keyof import("@prisma/client").NotificationPreference>> = {
    MENTIONED_IN_COMMENT: "inAppMentioned",
    NEW_COMMENT_ON_OWNED: "inAppNewCommentOwned",
    NEW_COMMENT_ON_SHARED: "inAppNewCommentShared",
    NEW_COMMENT_ON_PUBLIC: "inAppNewCommentPublic",
  }
  return (map[type] ?? "inAppMentioned") as keyof import("@prisma/client").NotificationPreference
}

function emailPrefKey(type: NotificationType): keyof import("@prisma/client").NotificationPreference {
  const map: Partial<Record<NotificationType, keyof import("@prisma/client").NotificationPreference>> = {
    MENTIONED_IN_COMMENT: "emailMentioned",
    NEW_COMMENT_ON_OWNED: "emailNewCommentOwned",
    NEW_COMMENT_ON_SHARED: "emailNewCommentShared",
    NEW_COMMENT_ON_PUBLIC: "emailNewCommentPublic",
  }
  return (map[type] ?? "emailMentioned") as keyof import("@prisma/client").NotificationPreference
}
