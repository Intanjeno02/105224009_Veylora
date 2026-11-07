-- CreateTable
CREATE TABLE "SecurityCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UrlInspection" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UrlInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecurityCategory_name_key" ON "SecurityCategory"("name");

-- CreateIndex
CREATE INDEX "UrlInspection_userId_idx" ON "UrlInspection"("userId");

-- CreateIndex
CREATE INDEX "UrlInspection_categoryId_idx" ON "UrlInspection"("categoryId");

-- CreateIndex
CREATE INDEX "UrlInspection_status_idx" ON "UrlInspection"("status");

-- AddForeignKey
ALTER TABLE "UrlInspection" ADD CONSTRAINT "UrlInspection_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SecurityCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UrlInspection" ADD CONSTRAINT "UrlInspection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
