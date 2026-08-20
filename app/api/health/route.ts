import { NextResponse } from "next/server";

/** Liveness probe: the process is up. No internal details are exposed. */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
