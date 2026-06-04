import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { addConnection, removeConnection } from "@/lib/sse/connections"

export const dynamic = "force-dynamic"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response("Unauthorized", { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user || user.status !== "ACTIVE") return new Response("Forbidden", { status: 403 })

  const encoder = new TextEncoder()

  // Shared across start() and cancel() via closure
  let controller: ReadableStreamDefaultController<Uint8Array>
  let heartbeat: ReturnType<typeof setInterval>

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl
      addConnection(user.id, controller)

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          // Client already gone — clean up proactively
          clearInterval(heartbeat)
          removeConnection(user.id, controller)
        }
      }, 25000)
    },
    cancel() {
      // Called when the client disconnects
      clearInterval(heartbeat)
      removeConnection(user.id, controller)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
