import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getMailProvider } from "@/lib/mail";
import { getPaymentProvider } from "@/lib/payments";
import { getFileStorageProvider } from "@/lib/files/storage";
import { logger } from "@/lib/logger";

/**
 * Readiness probe. Publicly returns only ready/not-ready (for load
 * balancers); component detail requires an authenticated ADMIN session.
 */
export async function GET() {
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (error) {
    logger.error("readiness: database check failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
  }

  const ready = dbOk;
  const user = await getCurrentUser().catch(() => null);

  if (user?.role === "ADMIN") {
    return NextResponse.json(
      {
        ready,
        components: {
          database: dbOk ? "ok" : "down",
          mailProvider: getMailProvider().key,
          paymentProvider: getPaymentProvider().key,
          fileStorageProvider: getFileStorageProvider().key,
          scheduledJobs: "none-configured", // roadmap: escalation/retention jobs
        },
      },
      { status: ready ? 200 : 503 },
    );
  }

  return NextResponse.json({ ready }, { status: ready ? 200 : 503 });
}
