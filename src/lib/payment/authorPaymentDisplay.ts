import type { ManagedPayment } from "@/lib/api/payments";

export function formatPaymentDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function paymentStatusLabel(status: ManagedPayment["status"]): string {
  if (status === "approved") return "Approved";
  if (status === "pending_review") return "Pending review";
  return "Rejected";
}

export function paymentMetaDate(payment: ManagedPayment): string {
  if (payment.status === "approved" && payment.reviewedAt) {
    return formatPaymentDate(payment.reviewedAt);
  }
  return formatPaymentDate(payment.submittedAt);
}

export function paymentDescriptionForAuthor(note: string | undefined): string {
  const trimmed = note?.trim();
  if (!trimmed) return "Publication fee (APC)";

  const parts = trimmed.split(/\s+[—\u2013-]\s+/u);
  if (parts.length >= 2) {
    const description = parts.slice(1).join(" — ").trim();
    if (description) return description;
  }

  return trimmed;
}

export function parsePaymentReferenceNote(note: string | undefined): {
  manuscriptNumber?: string;
  manuscriptTitle?: string;
} {
  const trimmed = note?.trim();
  if (!trimmed) return {};

  const parts = trimmed.split(/\s+[—\u2013-]\s+/u);
  if (parts.length >= 3 && parts[0]?.toUpperCase() === "APC") {
    return {
      manuscriptNumber: parts[1]?.trim(),
      manuscriptTitle: parts.slice(2).join(" — ").trim() || undefined,
    };
  }

  return {};
}
