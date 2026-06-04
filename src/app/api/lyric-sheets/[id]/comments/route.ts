import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getLyricSheetWithAccess } from "@/lib/sheet-access"
import { prisma } from "@/lib/prisma"
import { dispatch } from "@/lib/notifications/dispatch"
import { z } from "zod"

const createSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().optional(),
  anchor: z.unknown().optional(),
  mentionedUserIds: z.array(z.string()).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const result = await getLyricSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const comments = await prisma.comment.findMany({
    where: { lyricSheetId: id, parentId: null, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      mentionedUsers: { include: { user: { select: { id: true, name: true } } } },
      replies: {
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          mentionedUsers: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(comments)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const result = await getLyricSheetWithAccess(id, user.id)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = createSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const { content, parentId, anchor, mentionedUserIds = [] } = body.data

  const comment = await prisma.comment.create({
    data: {
      content,
      authorId: user.id,
      lyricSheetId: id,
      parentId: parentId ?? null,
      anchor: anchor ? (anchor as object) : undefined,
      mentionedUsers: mentionedUserIds.length
        ? { create: mentionedUserIds.map((uid) => ({ userId: uid })) }
        : undefined,
    },
    include: {
      author: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  })

  // Dispatch notifications
  const { sheet, isOwner } = result

  // Notify mentioned users
  for (const uid of mentionedUserIds) {
    if (uid !== user.id) {
      await dispatch({
        userId: uid,
        type: "MENTIONED_IN_COMMENT",
        payload: { commentId: comment.id, lyricSheetId: id, actorName: user.name ?? user.email },
      })
    }
  }

  // Notify owner if someone else commented
  if (!isOwner) {
    await dispatch({
      userId: sheet.ownerId,
      type: "NEW_COMMENT_ON_OWNED",
      payload: { commentId: comment.id, lyricSheetId: id, actorName: user.name ?? user.email },
    })
  }

  // Notify shared users (if not owner and not already mentioned)
  if (sheet.visibility === "PUBLIC") {
    // For public sheets, we don't fan out to all users here — they subscribe to a feed instead
  } else {
    const sharedUserIds = sheet.shares
      .map((s: { userId: string }) => s.userId)
      .filter((uid: string) => uid !== user.id && uid !== sheet.ownerId && !mentionedUserIds.includes(uid))

    for (const uid of sharedUserIds) {
      await dispatch({
        userId: uid,
        type: "NEW_COMMENT_ON_SHARED",
        payload: { commentId: comment.id, lyricSheetId: id, actorName: user.name ?? user.email },
      })
    }
  }

  return NextResponse.json(comment, { status: 201 })
}
