import { prisma } from "@/lib/prisma"

/** Returns the lyric sheet if the user can access it, null otherwise. */
export async function getLyricSheetWithAccess(sheetId: string, userId: string) {
  const sheet = await prisma.lyricSheet.findUnique({
    where: { id: sheetId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: true,
      tags: { include: { tag: true } },
    },
  })
  if (!sheet) return null

  const isOwner = sheet.ownerId === userId
  const isPublic = sheet.visibility === "PUBLIC"
  const share = sheet.shares.find((s) => s.userId === userId)

  if (!isOwner && !isPublic && !share) return null

  return { sheet, isOwner, share, permission: isOwner ? "EDITOR" : (share?.permission ?? "VIEWER") }
}

/** Returns the tab sheet if the user can access it, null otherwise. */
export async function getTabSheetWithAccess(sheetId: string, userId: string) {
  const sheet = await prisma.tabSheet.findUnique({
    where: { id: sheetId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: true,
      tags: { include: { tag: true } },
    },
  })
  if (!sheet) return null

  const isOwner = sheet.ownerId === userId
  const isPublic = sheet.visibility === "PUBLIC"
  const share = sheet.shares.find((s) => s.userId === userId)

  if (!isOwner && !isPublic && !share) return null

  return { sheet, isOwner, share, permission: isOwner ? "EDITOR" : (share?.permission ?? "VIEWER") }
}

/** Returns the music sheet if the user can access it, null otherwise. */
export async function getMusicSheetWithAccess(sheetId: string, userId: string) {
  const sheet = await prisma.musicSheet.findUnique({
    where: { id: sheetId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: true,
      tags: { include: { tag: true } },
    },
  })
  if (!sheet) return null

  const isOwner = sheet.ownerId === userId
  const isPublic = sheet.visibility === "PUBLIC"
  const share = sheet.shares.find((s) => s.userId === userId)

  if (!isOwner && !isPublic && !share) return null

  return { sheet, isOwner, share, permission: isOwner ? "EDITOR" : (share?.permission ?? "VIEWER") }
}
