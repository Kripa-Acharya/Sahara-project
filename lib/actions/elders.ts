"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamily } from "@/lib/auth";
import { canEditElder } from "@/lib/policies";
import type { FormState } from "@/lib/actions/auth";

const elderSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter the elder's full name."),
  nickname: z.string().trim().optional(),
  age: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().int().min(1, "Please enter a valid age.").max(120, "Please enter a valid age.").optional(),
  ),
  addressLine: z.string().trim().min(3, "Please enter the home address."),
  city: z.string().trim().min(2, "Please enter the city."),
  district: z.string().trim().optional(),
  locationNotes: z.string().trim().optional(),
  preferredLanguage: z.enum(["ne", "en"]),
  mobilityNotes: z.string().trim().optional(),
  healthNotes: z.string().trim().optional(),
  serviceNotes: z.string().trim().optional(),
});

function parseElderForm(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  if (formData.get("consentToShare") !== "on") {
    return {
      success: false as const,
      error: "Consent is required so we can share care details with the assigned companion.",
    };
  }
  const parsed = elderSchema.safeParse({
    fullName: text("fullName"),
    nickname: text("nickname"),
    age: text("age"),
    addressLine: text("addressLine"),
    city: text("city"),
    district: text("district"),
    locationNotes: text("locationNotes"),
    preferredLanguage: text("preferredLanguage") || "ne",
    mobilityNotes: text("mobilityNotes"),
    healthNotes: text("healthNotes"),
    serviceNotes: text("serviceNotes"),
  });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }
  return { success: true as const, data: parsed.data };
}

function generateAccessCode(): string {
  // Elder-friendly but non-guessable: 6 chars from an unambiguous alphabet
  // (~1.1 billion combinations) behind a per-IP lookup rate limit.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let suffix = "";
  for (const b of bytes) suffix += alphabet[b % alphabet.length];
  return `SAHARA-${suffix}`;
}

export async function createElder(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireFamily();
  const parsed = parseElderForm(formData);
  if (!parsed.success) return { error: parsed.error };
  const data = parsed.data;

  let elderAccessCode = generateAccessCode();
  while (await db.elderProfile.findUnique({ where: { elderAccessCode } })) {
    elderAccessCode = generateAccessCode();
  }

  await db.elderProfile.create({
    data: { ...data, consentToShare: true, familyId: profile.id, elderAccessCode },
  });
  revalidatePath("/family/elders");
  redirect("/family/elders");
}

export async function updateElder(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireFamily();
  const elderId = String(formData.get("elderId") ?? "");
  const elder = await canEditElder(user, elderId);
  if (!elder) return { error: "Elder profile not found." };

  const parsed = parseElderForm(formData);
  if (!parsed.success) return { error: parsed.error };
  const data = parsed.data;

  await db.elderProfile.update({ where: { id: elder.id }, data: { ...data, consentToShare: true } });
  revalidatePath("/family/elders");
  redirect(`/family/elders/${elder.id}`);
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter the contact's name."),
  relation: z.string().trim().min(2, "Please describe the relationship."),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
  isLocal: z.string().optional(),
  isPrimary: z.string().optional(),
});

export async function addEmergencyContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireFamily();
  const elderId = String(formData.get("elderId") ?? "");
  const elder = await canEditElder(user, elderId);
  if (!elder) return { error: "Elder profile not found." };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    relation: formData.get("relation"),
    phone: formData.get("phone"),
    isLocal: formData.get("isLocal"),
    isPrimary: formData.get("isPrimary"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await db.emergencyContact.create({
    data: {
      elderId: elder.id,
      name: parsed.data.name,
      relation: parsed.data.relation,
      phone: parsed.data.phone,
      isLocal: parsed.data.isLocal === "on",
      isPrimary: parsed.data.isPrimary === "on",
    },
  });
  revalidatePath(`/family/elders/${elder.id}`);
  return {};
}

export async function removeEmergencyContact(formData: FormData): Promise<void> {
  const { user } = await requireFamily();
  const contactId = String(formData.get("contactId") ?? "");
  const contact = await db.emergencyContact.findUnique({ where: { id: contactId } });
  if (!contact || !(await canEditElder(user, contact.elderId))) return;
  await db.emergencyContact.delete({ where: { id: contact.id } });
  revalidatePath(`/family/elders/${contact.elderId}`);
}
