/**
 * One-time script: creates/updates the admin user in the DB and syncs Clerk metadata.
 * Run with: npx tsx scripts/bootstrap-admin.ts
 */
import "dotenv/config"
import { createClerkClient } from "@clerk/backend"
import pg from "pg"

const db = new pg.Client({ connectionString: process.env.DATABASE_URL })

async function main() {
  await db.connect()

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

  // Find the user in Clerk by email
  const { data: clerkUsers } = await clerk.users.getUserList({
    emailAddress: ["da7idbarron@gmail.com"],
  })

  if (clerkUsers.length === 0) {
    console.error("No Clerk user found with that email. Make sure you've signed up first.")
    process.exit(1)
  }

  const clerkUser = clerkUsers[0]
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ""
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null
  console.log(`Found Clerk user: ${clerkUser.id} (${email})`)

  // Upsert user in DB as active admin
  await db.query(
    `INSERT INTO "User" (id, "clerkId", email, name, "avatarUrl", role, status, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'ADMIN', 'ACTIVE', now(), now())
     ON CONFLICT ("clerkId") DO UPDATE
       SET role = 'ADMIN', status = 'ACTIVE', "updatedAt" = now()`,
    [clerkUser.id, email, name, clerkUser.imageUrl || null]
  )
  console.log(`DB user upserted as ADMIN/ACTIVE`)

  // Update Clerk session metadata
  await clerk.users.updateUser(clerkUser.id, {
    publicMetadata: { status: "active", role: "admin" },
  })
  console.log("Clerk metadata updated: { status: 'active', role: 'admin' }")

  console.log("\n✅ Done! Sign out and back in at http://localhost:3000/sign-in to get a fresh session.")
}

main().catch(console.error).finally(() => db.end())
