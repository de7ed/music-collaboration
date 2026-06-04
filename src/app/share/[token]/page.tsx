import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { SharePageClient } from "@/components/share/share-page-client"

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      lyricSheet: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
          comments: {
            where: { parentId: null, deletedAt: null },
            include: {
              author: { select: { id: true, name: true, email: true } },
              replies: {
                where: { deletedAt: null },
                include: { author: { select: { id: true, name: true, email: true } } },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })

  if (!link) notFound()

  // Check if viewer is a logged-in platform member
  const { userId: clerkId } = await auth()
  let viewer = null
  if (clerkId) {
    viewer = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, name: true, email: true, status: true },
    })
    // Only treat as logged-in member if their account is active
    if (viewer?.status !== "ACTIVE") viewer = null
  }

  const { lyricSheet } = link

  return (
    <SharePageClient
      sheet={{
        id: lyricSheet.id,
        title: lyricSheet.title,
        content: lyricSheet.content as object,
        owner: lyricSheet.owner,
        tags: lyricSheet.tags.map((t) => t.tag),
        updatedAt: lyricSheet.updatedAt.toISOString(),
      }}
      comments={lyricSheet.comments.map((c) => ({
        ...c,
        anchor: (c.anchor as object | null) ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        replies: c.replies.map((r) => ({
          ...r,
          anchor: null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          mentionedUsers: [],
          replies: [],
          deletedAt: null,
        })),
        mentionedUsers: [],
        deletedAt: null,
      }))}
      viewer={viewer}

    />
  )
}
