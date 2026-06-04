import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function getCurrentDbUser() {
  const { userId } = await auth()
  if (!userId) return null
  return prisma.user.findUnique({ where: { clerkId: userId } })
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user || user.status !== "ACTIVE") throw new Error("Unauthorized")
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== UserRole.ADMIN) throw new Error("Forbidden")
  return user
}
