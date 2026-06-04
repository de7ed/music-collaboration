import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().max(100).nullable(),
})

export async function PATCH(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: body.data.name },
  })

  return NextResponse.json({ name: updated.name })
}
