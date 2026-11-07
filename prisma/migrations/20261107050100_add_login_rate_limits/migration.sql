-- CreateTable
CREATE TABLE "LoginRateLimit" (
    "username" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),

    CONSTRAINT "LoginRateLimit_pkey" PRIMARY KEY ("username")
);
