import { randomBytes } from "crypto";

/**
 * Structured JSON logging with automatic redaction.
 *
 * Provider-neutral: output goes to stdout as one JSON object per line, which
 * every log collector (CloudWatch, Loki, Datadog, …) can ingest. An error-
 * tracking SDK (e.g. Sentry) can be attached in `logError` without changing
 * call sites.
 *
 * Redaction: keys that commonly hold secrets or personal data are replaced
 * before serialization. Never pass raw passwords/tokens/cookies to the
 * logger anyway — redaction is the safety net, not the policy.
 */

const REDACT_KEYS =
  /pass(word)?|token|secret|cookie|authorization|accesscode|recovery|otp|sessionid|tokenhash|email|phone/i;

type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACT_KEYS.test(key) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...(context ? (redact(context) as Record<string, unknown>) : {}),
  });
  if (level === "error" || level === "critical") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
  /**
   * Operational alerts (unacknowledged SOS, failed emergency notification,
   * repeated auth failures, …). Production should route `critical` lines to a
   * paging/alerting hook; the interface point is exactly here.
   */
  critical: (message: string, context?: Record<string, unknown>) =>
    emit("critical", message, context),
};

/** Correlation id for tracing one request/action across log lines. */
export function newRequestId(): string {
  return randomBytes(8).toString("hex");
}
