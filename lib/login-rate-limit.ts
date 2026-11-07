import prisma from "@/lib/prisma";

export const LOGIN_FAILURE_LIMIT = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

type FailedAttemptResult = {
  failedAttempts: number;
  blockedUntil: Date | null;
};

export class LoginRateLimitStorageError extends Error {
  constructor(cause: unknown) {
    super("Login rate limit storage is unavailable.");
    this.name = "LoginRateLimitStorageError";
    this.cause = cause;
  }
}

export async function getLoginRateLimit(username: string): Promise<{
  blockedUntil: Date | null;
}> {
  try {
    const now = new Date();
    const expiredWindow = new Date(now.getTime() - LOGIN_RATE_LIMIT_WINDOW_MS);

    await prisma.loginRateLimit.deleteMany({
      where: {
        OR: [
          { blockedUntil: { lte: now } },
          {
            AND: [
              { blockedUntil: null },
              { windowStartedAt: { lte: expiredWindow } },
            ],
          },
        ],
      },
    });

    const record = await prisma.loginRateLimit.findUnique({
      where: { username },
      select: { blockedUntil: true },
    });

    return {
      blockedUntil:
        record?.blockedUntil && record.blockedUntil > new Date()
          ? record.blockedUntil
          : null,
    };
  } catch (error) {
    throw new LoginRateLimitStorageError(error);
  }
}

export async function recordFailedLogin(username: string): Promise<{
  blockedUntil: Date | null;
}> {
  try {
    const [result] = await prisma.$queryRaw<FailedAttemptResult[]>`
      INSERT INTO "LoginRateLimit" (
        "username",
        "failedAttempts",
        "windowStartedAt",
        "blockedUntil"
      )
      VALUES (${username}, 1, CURRENT_TIMESTAMP, NULL)
      ON CONFLICT ("username") DO UPDATE SET
        "failedAttempts" = CASE
          WHEN "LoginRateLimit"."blockedUntil" > CURRENT_TIMESTAMP
            THEN "LoginRateLimit"."failedAttempts"
          WHEN "LoginRateLimit"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            OR (
              "LoginRateLimit"."blockedUntil" IS NOT NULL
              AND "LoginRateLimit"."blockedUntil" <= CURRENT_TIMESTAMP
            )
            THEN 1
          ELSE "LoginRateLimit"."failedAttempts" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "LoginRateLimit"."blockedUntil" > CURRENT_TIMESTAMP
            THEN "LoginRateLimit"."windowStartedAt"
          WHEN "LoginRateLimit"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            OR (
              "LoginRateLimit"."blockedUntil" IS NOT NULL
              AND "LoginRateLimit"."blockedUntil" <= CURRENT_TIMESTAMP
            )
            THEN CURRENT_TIMESTAMP
          ELSE "LoginRateLimit"."windowStartedAt"
        END,
        "blockedUntil" = CASE
          WHEN "LoginRateLimit"."blockedUntil" > CURRENT_TIMESTAMP
            THEN "LoginRateLimit"."blockedUntil"
          WHEN "LoginRateLimit"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            OR (
              "LoginRateLimit"."blockedUntil" IS NOT NULL
              AND "LoginRateLimit"."blockedUntil" <= CURRENT_TIMESTAMP
            )
            THEN NULL
          WHEN "LoginRateLimit"."failedAttempts" + 1 >= ${LOGIN_FAILURE_LIMIT}
            THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
          ELSE NULL
        END
      RETURNING "failedAttempts", "blockedUntil"
    `;

    if (!result) {
      throw new Error("Rate limit update returned no row.");
    }

    return {
      blockedUntil:
        result.blockedUntil && result.blockedUntil > new Date()
          ? result.blockedUntil
          : null,
    };
  } catch (error) {
    if (error instanceof LoginRateLimitStorageError) {
      throw error;
    }

    throw new LoginRateLimitStorageError(error);
  }
}

export async function resetLoginRateLimit(username: string): Promise<void> {
  try {
    await prisma.loginRateLimit.deleteMany({
      where: { username },
    });
  } catch (error) {
    throw new LoginRateLimitStorageError(error);
  }
}

export function getRetryAfterSeconds(blockedUntil: Date): number {
  return Math.max(1, Math.ceil((blockedUntil.getTime() - Date.now()) / 1000));
}
