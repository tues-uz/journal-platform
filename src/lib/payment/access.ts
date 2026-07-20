import type { AuthUser } from "@/features/auth/storage";
import type { Role } from "@/lib/rbac/types";
import type { PaymentRequest, PaymentSettings } from "@/lib/store/types";

export function isPureAuthor(roles: Role[]): boolean {
  return roles.includes("author") && !roles.some((role) => role !== "author");
}

export function hasApprovedPayment(authorId: string, payments: PaymentRequest[]): boolean {
  return payments.some((payment) => payment.authorId === authorId && payment.status === "approved");
}

export function getLatestPaymentForAuthor(
  authorId: string,
  payments: PaymentRequest[],
): PaymentRequest | undefined {
  return payments
    .filter((payment) => payment.authorId === authorId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
}

export function canAuthorCreateSubmission(
  user: AuthUser,
  payments: PaymentRequest[],
  settings: PaymentSettings,
): boolean {
  if (!settings.enabled) return true;
  if (!isPureAuthor(user.roles)) return true;
  return hasApprovedPayment(user.id, payments);
}

export function formatPaymentAmount(amount: number, currency: string): string {
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
