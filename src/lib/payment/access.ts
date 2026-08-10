import type { AuthUser } from "@/features/auth/storage";
import { isDemoMode } from "@/lib/demo/mode";
import type { Role } from "@/lib/rbac/types";
import type { PaymentRequest, PaymentSettings, Submission } from "@/lib/store/types";

export function isPureAuthor(roles: Role[]): boolean {
  return roles.includes("author") && !roles.some((role) => role !== "author");
}

/** APC is charged after acceptance, only when payments are enabled outside demo mode. */
export function isApcRequired(
  paymentSettings: Pick<PaymentSettings, "enabled"> | undefined,
): boolean {
  return !!paymentSettings?.enabled && !isDemoMode();
}

export function hasApprovedPayment(authorId: string, payments: PaymentRequest[]): boolean {
  return payments.some((payment) => payment.authorId === authorId && payment.status === "approved");
}

export type SubmissionApcState = "none" | "due" | "pending_review" | "paid" | "rejected";

/** Derive APC display state from submission status and the author's payment history. */
export function getSubmissionApcState(
  submission: Pick<Submission, "status" | "acceptancePaymentVerified" | "authorId">,
  authorPayments: Pick<PaymentRequest, "authorId" | "status" | "submittedAt">[],
): SubmissionApcState {
  if (submission.acceptancePaymentVerified) return "paid";
  if (submission.status !== "payment_pending") return "none";

  const payments = authorPayments
    .filter((payment) => payment.authorId === submission.authorId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  if (payments.some((payment) => payment.status === "approved")) return "paid";
  if (payments.some((payment) => payment.status === "pending_review")) return "pending_review";

  const latest = payments[0];
  if (latest?.status === "rejected") return "rejected";
  return "due";
}

export function getPaymentPendingAssigneePrefix(apcState: SubmissionApcState | undefined): string {
  if (apcState === "pending_review") return "Payment proof under review for";
  if (apcState === "paid") return "Payment verified for";
  return "Payment due for";
}

export function getLatestPaymentForAuthor(
  authorId: string,
  payments: PaymentRequest[],
): PaymentRequest | undefined {
  return payments
    .filter((payment) => payment.authorId === authorId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
}

export function canBeginLayoutProduction(
  submission: Pick<Submission, "status" | "acceptancePaymentVerified" | "proofReady">,
  paymentSettings: Pick<PaymentSettings, "enabled"> | undefined,
): boolean {
  if (submission.proofReady) return false;
  if (isApcRequired(paymentSettings)) {
    return submission.status === "production" && submission.acceptancePaymentVerified === true;
  }
  return submission.status === "accepted" || submission.status === "production";
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
