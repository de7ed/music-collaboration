-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "tabSheetId" TEXT;

-- AlterTable
ALTER TABLE "ShareLink" ADD COLUMN     "tabSheetId" TEXT,
ALTER COLUMN "lyricSheetId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TabSheet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TabSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabSheetVersion" (
    "id" TEXT NOT NULL,
    "tabSheetId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TabSheetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabSheetShare" (
    "id" TEXT NOT NULL,
    "tabSheetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "SharePermission" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TabSheetShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabSheetTag" (
    "tabSheetId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TabSheetTag_pkey" PRIMARY KEY ("tabSheetId","tagId")
);

-- CreateIndex
CREATE INDEX "TabSheet_ownerId_idx" ON "TabSheet"("ownerId");

-- CreateIndex
CREATE INDEX "TabSheet_visibility_idx" ON "TabSheet"("visibility");

-- CreateIndex
CREATE INDEX "TabSheetVersion_tabSheetId_createdAt_idx" ON "TabSheetVersion"("tabSheetId", "createdAt");

-- CreateIndex
CREATE INDEX "TabSheetVersion_tabSheetId_isCheckIn_idx" ON "TabSheetVersion"("tabSheetId", "isCheckIn");

-- CreateIndex
CREATE INDEX "TabSheetShare_userId_idx" ON "TabSheetShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TabSheetShare_tabSheetId_userId_key" ON "TabSheetShare"("tabSheetId", "userId");

-- CreateIndex
CREATE INDEX "Comment_tabSheetId_idx" ON "Comment"("tabSheetId");

-- CreateIndex
CREATE INDEX "ShareLink_tabSheetId_idx" ON "ShareLink"("tabSheetId");

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_tabSheetId_fkey" FOREIGN KEY ("tabSheetId") REFERENCES "TabSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_tabSheetId_fkey" FOREIGN KEY ("tabSheetId") REFERENCES "TabSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabSheet" ADD CONSTRAINT "TabSheet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabSheetVersion" ADD CONSTRAINT "TabSheetVersion_tabSheetId_fkey" FOREIGN KEY ("tabSheetId") REFERENCES "TabSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabSheetShare" ADD CONSTRAINT "TabSheetShare_tabSheetId_fkey" FOREIGN KEY ("tabSheetId") REFERENCES "TabSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabSheetShare" ADD CONSTRAINT "TabSheetShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabSheetTag" ADD CONSTRAINT "TabSheetTag_tabSheetId_fkey" FOREIGN KEY ("tabSheetId") REFERENCES "TabSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabSheetTag" ADD CONSTRAINT "TabSheetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
