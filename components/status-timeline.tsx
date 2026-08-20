import type { BookingStatus } from "@prisma/client";
import { bookingStatusLabel, bookingTimeline } from "@/lib/labels";

/**
 * Simple visual timeline of a booking's progress.
 * Cancelled/disputed bookings show a notice instead of a step marker.
 */
export function StatusTimeline({ status }: { status: BookingStatus }) {
  if (status === "CANCELLED" || status === "DISPUTED") {
    return (
      <p className="rounded-xl bg-stone-100 text-stone-600 px-4 py-3 text-sm">
        This booking is <strong>{bookingStatusLabel[status].toLowerCase()}</strong>.
      </p>
    );
  }

  // Map in-between statuses onto the five display steps.
  const displayStatus: BookingStatus =
    status === "REQUESTED" || status === "DRAFT" || status === "AWAITING_ASSIGNMENT"
      ? "REQUESTED"
      : status === "ACCEPTED"
        ? "COMPANION_ASSIGNED"
        : status;
  const currentIndex = bookingTimeline.indexOf(displayStatus);

  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {bookingTimeline.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={step} className="flex items-center">
            <span className="flex flex-col items-center text-center w-20 sm:w-24">
              <span
                aria-hidden
                className={[
                  "flex size-8 items-center justify-center rounded-full text-sm font-bold border-2",
                  done
                    ? "bg-leaf-600 border-leaf-600 text-white"
                    : current
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-white border-stone-300 text-stone-400",
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={[
                  "mt-1 text-xs leading-tight",
                  current ? "font-bold text-primary-700" : done ? "text-leaf-700" : "text-stone-400",
                ].join(" ")}
              >
                {bookingStatusLabel[step]}
              </span>
            </span>
            {i < bookingTimeline.length - 1 && (
              <span
                aria-hidden
                className={[
                  "hidden sm:block h-0.5 w-6 -mt-5",
                  i < currentIndex ? "bg-leaf-500" : "bg-stone-300",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
