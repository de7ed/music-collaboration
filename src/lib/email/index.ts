import { Resend } from "resend"
import { NotificationType } from "@prisma/client"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com"

export async function sendInviteEmail({
  to,
  inviterName,
  token,
}: {
  to: string
  inviterName: string
  token: string
}) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?invite=${token}`
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} invited you to Music Collab`,
    html: `<p>${inviterName} has invited you to join Music Collab.</p><p><a href="${url}">Accept invitation</a></p>`,
  })
}

export async function sendApprovalEmail({ to, name }: { to: string; name: string }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Music Collab account has been approved",
    html: `<p>Hi ${name},</p><p>Your account has been approved. <a href="${process.env.NEXT_PUBLIC_APP_URL}/sign-in">Sign in now</a></p>`,
  })
}

export async function sendRejectionEmail({ to, name }: { to: string; name: string }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Music Collab account update",
    html: `<p>Hi ${name},</p><p>Unfortunately your account request was not approved. Contact the admin if you think this is a mistake.</p>`,
  })
}

export async function sendNotificationEmail({
  to,
  type,
  payload,
}: {
  to: string
  type: NotificationType
  payload: Record<string, unknown>
}) {
  const subjects: Partial<Record<NotificationType, string>> = {
    MENTIONED_IN_COMMENT: "You were mentioned in a comment",
    NEW_COMMENT_ON_OWNED: "New comment on your sheet",
    NEW_COMMENT_ON_SHARED: "New comment on a shared sheet",
    NEW_COMMENT_ON_PUBLIC: "New comment on a public sheet",
  }

  const subject = subjects[type] ?? "Music Collab notification"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const sheetUrl = payload.lyricSheetId
    ? `${appUrl}/lyric-sheets/${payload.lyricSheetId}`
    : payload.musicSheetId
      ? `${appUrl}/music-sheets/${payload.musicSheetId}`
      : appUrl

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `<p>${subject}. <a href="${sheetUrl}">View it here</a></p>`,
  })
}
