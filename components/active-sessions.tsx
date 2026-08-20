import { getCurrentUserWithSession } from "@/lib/auth";
import { listActiveSessions } from "@/lib/session";
import { revokeOneSession, revokeOtherSessions } from "@/lib/actions/settings";
import { formatDateTime } from "@/lib/format";
import { Badge, Card, CardBody } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

/** Approximate, friendly device description from the User-Agent string. */
function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome/")
      ? "Chrome"
      : ua.includes("safari/") && !ua.includes("chrome/")
        ? "Safari"
        : ua.includes("firefox/")
          ? "Firefox"
          : "Browser";
  const device = ua.includes("mobile")
    ? "mobile"
    : ua.includes("windows")
      ? "Windows"
      : ua.includes("mac os")
        ? "Mac"
        : ua.includes("linux")
          ? "Linux"
          : "device";
  return `${browser} on ${device}`;
}

/** "Where you're signed in" card, shared by every role's settings page. */
export async function ActiveSessions() {
  const current = await getCurrentUserWithSession();
  if (!current) return null;
  const sessions = await listActiveSessions(current.user.id);

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-lg text-stone-800">Where you&apos;re signed in</h2>
          {sessions.length > 1 && (
            <form action={revokeOtherSessions}>
              <SubmitButton variant="outline" size="sm" pendingText="Signing out…">
                Sign out other devices
              </SubmitButton>
            </form>
          )}
        </div>
        <ul className="space-y-3">
          {sessions.map((session) => {
            const isCurrent = session.id === current.session.id;
            return (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-stone-800">
                    {describeDevice(session.userAgent)}{" "}
                    {isCurrent && <Badge tone="bg-leaf-100 text-leaf-700">This device</Badge>}
                  </p>
                  <p className="text-sm text-stone-500">
                    Last active {formatDateTime(session.lastActiveAt)}
                    {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                  </p>
                </div>
                {!isCurrent && (
                  <form action={revokeOneSession}>
                    <input type="hidden" name="sessionId" value={session.id} />
                    <SubmitButton variant="ghost" size="sm" pendingText="…">
                      Sign out
                    </SubmitButton>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
