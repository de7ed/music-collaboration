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

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addConnection(user.id, controller)

      // Send a heartbeat every 25 seconds to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25000)

      // Clean up on stream close
      const cleanup = () => {
        clearInterval(heartbeat)
        removeConnection(user.id, controller)
      }

      // Store cleanup on controller for abort handling
      ;(controller as unknown as { _cleanup: () => void })._cleanup = cleanup
    },
    cancel(controller) {
      ;(controller as unknown as { _cleanup?: () => void })._cleanup?.()
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
