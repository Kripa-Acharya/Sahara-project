"use client";

import { useActionState, useState } from "react";
import { upsertService } from "@/lib/actions/admin";
import { Badge, Button, Card, CardBody, FormError, FormSuccess, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type ServiceItem = {
  id: string;
  name: string;
  nameNe: string | null;
  description: string;
  icon: string;
  estimatedMinutes: number;
  basePriceNpr: number;
  transportRequired: boolean;
  requiresApproval: boolean;
  isActive: boolean;
};

export function ServiceEditor({ services }: { services: ServiceItem[] }) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => setEditingId(editingId === "new" ? null : "new")}>
          {editingId === "new" ? "Close" : "+ Add service"}
        </Button>
      </div>
      {editingId === "new" && <ServiceForm onDone={() => setEditingId(null)} />}

      {services.map((service) =>
        editingId === service.id ? (
          <ServiceForm key={service.id} service={service} onDone={() => setEditingId(null)} />
        ) : (
          <Card key={service.id} className={service.isActive ? undefined : "opacity-60"}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span aria-hidden className="text-2xl">{service.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-stone-800">
                    {service.name}{" "}
                    {!service.isActive && <Badge tone="bg-stone-200 text-stone-600">Inactive</Badge>}
                    {service.requiresApproval && (
                      <Badge tone="bg-amber-100 text-amber-800">Approval</Badge>
                    )}
                  </p>
                  <p className="text-sm text-stone-500">
                    NPR {service.basePriceNpr.toLocaleString()} · ~{service.estimatedMinutes} min
                    {service.transportRequired ? " · transport" : ""}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditingId(service.id)}>
                Edit
              </Button>
            </CardBody>
          </Card>
        ),
      )}
    </div>
  );
}

function ServiceForm({ service, onDone }: { service?: ServiceItem; onDone: () => void }) {
  const [state, action] = useActionState(upsertService, undefined);

  return (
    <Card className="border-primary-300">
      <CardBody>
        <h2 className="font-bold text-stone-800 mb-4">
          {service ? `Edit — ${service.name}` : "New service"}
        </h2>
        <form action={action} className="space-y-4">
          <FormError message={state?.error} />
          {state && !state.error && <FormSuccess message="Saved." />}
          {service && <input type="hidden" name="serviceId" value={service.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="svc-name">Name *</Label>
              <Input id="svc-name" name="name" defaultValue={service?.name} required />
            </div>
            <div>
              <Label htmlFor="svc-name-ne">Nepali name</Label>
              <Input id="svc-name-ne" name="nameNe" defaultValue={service?.nameNe ?? ""} />
            </div>
            <div>
              <Label htmlFor="svc-icon">Icon (emoji) *</Label>
              <Input id="svc-icon" name="icon" defaultValue={service?.icon ?? "🫶"} required />
            </div>
            <div>
              <Label htmlFor="svc-minutes">Estimated minutes *</Label>
              <Input
                id="svc-minutes"
                name="estimatedMinutes"
                type="number"
                min={15}
                max={720}
                defaultValue={service?.estimatedMinutes ?? 60}
                required
              />
            </div>
            <div>
              <Label htmlFor="svc-price">Base price (NPR) *</Label>
              <Input
                id="svc-price"
                name="basePriceNpr"
                type="number"
                min={0}
                defaultValue={service?.basePriceNpr ?? 500}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="svc-description">Description *</Label>
            <Textarea id="svc-description" name="description" defaultValue={service?.description} required />
          </div>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="transportRequired" defaultChecked={service?.transportRequired} className="size-4 accent-primary-600" />
              Transport may be required
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="requiresApproval" defaultChecked={service?.requiresApproval} className="size-4 accent-primary-600" />
              Requires admin approval
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="isActive" defaultChecked={service?.isActive ?? true} className="size-4 accent-leaf-600" />
              Active
            </label>
          </div>
          <div className="flex gap-2">
            <SubmitButton pendingText="Saving…">Save service</SubmitButton>
            <Button type="button" variant="outline" onClick={onDone}>Close</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
