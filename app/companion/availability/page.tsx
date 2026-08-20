import { requireCompanion } from "@/lib/auth";
import { db } from "@/lib/db";
import { removeAvailability } from "@/lib/actions/companion";
import { formatTime } from "@/lib/format";
import { Card, CardBody, PageHeader } from "@/components/ui";
import { AddAvailabilityForm } from "./availability-form";

const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function AvailabilityPage() {
  const { profile } = await requireCompanion();
  const slots = await db.availability.findMany({
    where: { companionId: profile.id },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Availability"
        subtitle="Tell साहारा when you can visit. Admins use this when assigning visits."
      />

      <Card className="mb-5">
        <CardBody>
          {slots.length === 0 ? (
            <p className="text-stone-500">
              No availability set yet — add your weekly hours below.
            </p>
          ) : (
            <ul className="space-y-2">
              {slots.map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-2.5"
                >
                  <span className="text-stone-700">
                    <strong>{weekdayNames[slot.weekday]}</strong> · {formatTime(slot.startTime)} –{" "}
                    {formatTime(slot.endTime)}
                  </span>
                  <form action={removeAvailability}>
                    <input type="hidden" name="slotId" value={slot.id} />
                    <button type="submit" className="text-sm text-rose-600 hover:underline">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="font-bold text-stone-800 mb-3">Add hours</h2>
          <AddAvailabilityForm />
        </CardBody>
      </Card>
    </div>
  );
}
