import { Webhook } from "svix"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { clerkClient } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) return new Response("Missing webhook secret", { status: 500 })

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: { type: string; data: Record<string, unknown> }

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof evt
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  if (evt.type === "user.created") {
    const { id: clerkId, email_addresses, first_name, last_name, image_url } = evt.data as {
      id: string
      email_addresses: Array<{ email_address: string; id: string }>
      first_name?: string
      last_name?: string
      image_url?: string
    }

    const email = email_addresses[0]?.email_address
    if (!email) return new Response("No email", { status: 400 })

    const name = [first_name, last_name].filter(Boolean).join(" ") || null

    await prisma.user.upsert({
      where: { clerkId },
      create: { clerkId, email, name, avatarUrl: image_url ?? null, status: "PENDING" },
      update: { email, name, avatarUrl: image_url ?? null },
    })

    // Set pending status in Clerk metadata so middleware can read from JWT
    const client = await clerkClient()
    await client.users.updateUser(clerkId, {
      publicMetadata: { status: "pending", role: "standard" },
    })
  }

  if (evt.type === "user.deleted") {
    const { id: clerkId } = evt.data as { id: string }
    if (clerkId) {
      await prisma.user.deleteMany({ where: { clerkId } })
    }
  }

  return new Response("OK", { status: 200 })
}
