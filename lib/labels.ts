import type {
  AlertStatus,
  AssignmentStatus,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  VerificationStatus,
} from "@prisma/client";

/** Human-friendly labels and badge colours for enum statuses. */

export const bookingStatusLabel: Record<BookingStatus, string> = {
  DRAFT: "Draft",
  REQUESTED: "Requested",
  AWAITING_ASSIGNMENT: "Awaiting assignment",
  COMPANION_ASSIGNED: "Companion assigned",
  ACCEPTED: "Accepted",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

export const bookingStatusTone: Record<BookingStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-700",
  REQUESTED: "bg-amber-100 text-amber-800",
  AWAITING_ASSIGNMENT: "bg-amber-100 text-amber-800",
  COMPANION_ASSIGNED: "bg-sky-100 text-sky-800",
  ACCEPTED: "bg-sky-100 text-sky-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  IN_PROGRESS: "bg-violet-100 text-violet-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-200 text-stone-600",
  DISPUTED: "bg-rose-100 text-rose-800",
};

/** Ordered steps shown on the booking timeline. */
export const bookingTimeline: BookingStatus[] = [
  "REQUESTED",
  "COMPANION_ASSIGNED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
];

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  AUTHORIZED: "Authorized",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  CASH_DUE: "Cash due",
  CASH_RECEIVED: "Cash received",
};

export const paymentStatusTone: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  AUTHORIZED: "bg-sky-100 text-sky-800",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  REFUNDED: "bg-stone-200 text-stone-600",
  CASH_DUE: "bg-amber-100 text-amber-800",
  CASH_RECEIVED: "bg-emerald-100 text-emerald-800",
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  INTERNATIONAL_CARD: "International card",
  ESEWA: "eSewa",
  KHALTI: "Khalti",
  MOBILE_BANKING: "Mobile banking",
  CASH: "Cash",
  REMITTANCE: "Remittance-linked",
};

export const verificationStatusLabel: Record<VerificationStatus, string> = {
  INCOMPLETE: "Incomplete",
  UNDER_REVIEW: "Under review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export const verificationStatusTone: Record<VerificationStatus, string> = {
  INCOMPLETE: "bg-stone-100 text-stone-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  SUSPENDED: "bg-rose-100 text-rose-800",
};

export const assignmentStatusLabel: Record<AssignmentStatus, string> = {
  PENDING: "Waiting for companion",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const alertStatusLabel: Record<AlertStatus, string> = {
  ACTIVE: "Active",
  ACKNOWLEDGED: "Acknowledged",
  RESOLVED: "Resolved",
};

export const alertStatusTone: Record<AlertStatus, string> = {
  ACTIVE: "bg-rose-100 text-rose-800",
  ACKNOWLEDGED: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
};

export const verificationChecklist: { key: string; label: string }[] = [
  { key: "idSubmitted", label: "Citizenship or ID submitted" },
  { key: "policeReportSubmitted", label: "Police report submitted" },
  { key: "referencesChecked", label: "References checked" },
  { key: "phoneVerified", label: "Phone number verified" },
  { key: "addressVerified", label: "Address verified" },
  { key: "interviewCompleted", label: "Interview completed" },
  { key: "orientationCompleted", label: "Orientation completed" },
  { key: "skillsReviewed", label: "Skills reviewed" },
  { key: "emergencyTrainingDone", label: "Emergency procedure training" },
  { key: "finalApproval", label: "Final approval" },
];
