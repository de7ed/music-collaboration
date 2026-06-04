import "dotenv/config"
import { createClerkClient } from "@clerk/backend"

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const { data } = await clerk.users.getUserList({ limit: 20 })
console.log("Clerk users:", data.map(u => ({ id: u.id, email: u.emailAddresses[0]?.emailAddress, name: [u.firstName, u.lastName].filter(Boolean).join(" ") })))
