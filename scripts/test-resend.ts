/**
 * Quick Resend sanity check — sends a test email to yourself.
 * Run: npx tsx scripts/test-resend.ts
 */
import "dotenv/config"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const from = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com"

async function main() {
  const { data, error } = await resend.emails.send({
    from,
    to: "da7idbarron@gmail.com",
    subject: "Music Collab — Resend test",
    html: `<p>If you're reading this, Resend is configured correctly ✓</p><p>From: <code>${from}</code></p>`,
  })

  if (error) {
    console.error("❌ Resend error:", error)
    process.exit(1)
  }

  console.log("✅ Email sent! ID:", data?.id)
  console.log(`   From: ${from}`)
  console.log("   Check your inbox at da7idbarron@gmail.com")
}

main().catch(console.error)
