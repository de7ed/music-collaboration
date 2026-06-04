// In-process SSE connection registry.
// For multi-instance prod, replace with Redis pub/sub without changing callers.

type Controller = ReadableStreamDefaultController<Uint8Array>

const connections = new Map<string, Set<Controller>>()

export function addConnection(userId: string, controller: Controller) {
  if (!connections.has(userId)) connections.set(userId, new Set())
  connections.get(userId)!.add(controller)
}

export function removeConnection(userId: string, controller: Controller) {
  connections.get(userId)?.delete(controller)
  if (connections.get(userId)?.size === 0) connections.delete(userId)
}

export function pushToUser(userId: string, data: object) {
  const userConnections = connections.get(userId)
  if (!userConnections) return
  const encoded = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
  for (const controller of Array.from(userConnections)) {
    try {
      controller.enqueue(encoded)
    } catch {
      userConnections.delete(controller)
    }
  }
}
