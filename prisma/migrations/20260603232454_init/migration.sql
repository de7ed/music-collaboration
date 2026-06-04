-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STANDARD');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'SHARED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "SharePermission" AS ENUM ('VIEWER', 'EDITOR');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MENTIONED_IN_COMMENT', 'NEW_COMMENT_ON_OWNED', 'NEW_COMMENT_ON_SHARED', 'NEW_COMMENT_ON_PUBLIC', 'ACCOUNT_APPROVED', 'ACCOUNT_REJECTED', 'INVITE_ACCEPTED');

-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('APPROVE_USER', 'REJECT_USER', 'SUSPEND_USER', 'CHANGE_ROLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STANDARD',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LyricSheet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LyricSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LyricSheetVersion" (
    "id" TEXT NOT NULL,
    "lyricSheetId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LyricSheetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LyricSheetShare" (
    "id" TEXT NOT NULL,
    "lyricSheetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "SharePermission" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LyricSheetShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LyricSheetTag" (
    "lyricSheetId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "LyricSheetTag_pkey" PRIMARY KEY ("lyricSheetId","tagId")
);

-- CreateTable
CREATE TABLE "MusicSheet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lyricSheetId" TEXT,

    CONSTRAINT "MusicSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicSheetShare" (
    "id" TEXT NOT NULL,
    "musicSheetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "SharePermission" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MusicSheetShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicSheetTag" (
    "musicSheetId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MusicSheetTag_pkey" PRIMARY KEY ("musicSheetId","tagId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lyricSheetId" TEXT,
    "musicSheetId" TEXT,
    "parentId" TEXT,
    "anchor" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentMention" (
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CommentMention_pkey" PRIMARY KEY ("commentId","userId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "readAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "userId" TEXT NOT NULL,
    "inAppMentioned" BOOLEAN NOT NULL DEFAULT true,
    "inAppNewCommentOwned" BOOLEAN NOT NULL DEFAULT true,
    "inAppNewCommentShared" BOOLEAN NOT NULL DEFAULT true,
    "inAppNewCommentPublic" BOOLEAN NOT NULL DEFAULT false,
    "emailMentioned" BOOLEAN NOT NULL DEFAULT true,
    "emailNewCommentOwned" BOOLEAN NOT NULL DEFAULT true,
    "emailNewCommentShared" BOOLEAN NOT NULL DEFAULT false,
    "emailNewCommentPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" "AdminActionType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "LyricSheet_ownerId_idx" ON "LyricSheet"("ownerId");

-- CreateIndex
CREATE INDEX "LyricSheet_visibility_idx" ON "LyricSheet"("visibility");

-- CreateIndex
CREATE INDEX "LyricSheetVersion_lyricSheetId_createdAt_idx" ON "LyricSheetVersion"("lyricSheetId", "createdAt");

-- CreateIndex
CREATE INDEX "LyricSheetVersion_lyricSheetId_isCheckIn_idx" ON "LyricSheetVersion"("lyricSheetId", "isCheckIn");

-- CreateIndex
CREATE INDEX "LyricSheetShare_userId_idx" ON "LyricSheetShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LyricSheetShare_lyricSheetId_userId_key" ON "LyricSheetShare"("lyricSheetId", "userId");

-- CreateIndex
CREATE INDEX "MusicSheet_ownerId_idx" ON "MusicSheet"("ownerId");

-- CreateIndex
CREATE INDEX "MusicSheet_lyricSheetId_idx" ON "MusicSheet"("lyricSheetId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicSheetShare_musicSheetId_userId_key" ON "MusicSheetShare"("musicSheetId", "userId");

-- CreateIndex
CREATE INDEX "Comment_lyricSheetId_idx" ON "Comment"("lyricSheetId");

-- CreateIndex
CREATE INDEX "Comment_musicSheetId_idx" ON "Comment"("musicSheetId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_adminId_idx" ON "AdminAction"("adminId");

-- CreateIndex
CREATE INDEX "AdminAction_targetId_idx" ON "AdminAction"("targetId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LyricSheet" ADD CONSTRAINT "LyricSheet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LyricSheetVersion" ADD CONSTRAINT "LyricSheetVersion_lyricSheetId_fkey" FOREIGN KEY ("lyricSheetId") REFERENCES "LyricSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LyricSheetShare" ADD CONSTRAINT "LyricSheetShare_lyricSheetId_fkey" FOREIGN KEY ("lyricSheetId") REFERENCES "LyricSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LyricSheetShare" ADD CONSTRAINT "LyricSheetShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LyricSheetTag" ADD CONSTRAINT "LyricSheetTag_lyricSheetId_fkey" FOREIGN KEY ("lyricSheetId") REFERENCES "LyricSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LyricSheetTag" ADD CONSTRAINT "LyricSheetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicSheet" ADD CONSTRAINT "MusicSheet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicSheet" ADD CONSTRAINT "MusicSheet_lyricSheetId_fkey" FOREIGN KEY ("lyricSheetId") REFERENCES "LyricSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicSheetShare" ADD CONSTRAINT "MusicSheetShare_musicSheetId_fkey" FOREIGN KEY ("musicSheetId") REFERENCES "MusicSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicSheetShare" ADD CONSTRAINT "MusicSheetShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicSheetTag" ADD CONSTRAINT "MusicSheetTag_musicSheetId_fkey" FOREIGN KEY ("musicSheetId") REFERENCES "MusicSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicSheetTag" ADD CONSTRAINT "MusicSheetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_lyricSheetId_fkey" FOREIGN KEY ("lyricSheetId") REFERENCES "LyricSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_musicSheetId_fkey" FOREIGN KEY ("musicSheetId") REFERENCES "MusicSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentMention" ADD CONSTRAINT "CommentMention_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentMention" ADD CONSTRAINT "CommentMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
