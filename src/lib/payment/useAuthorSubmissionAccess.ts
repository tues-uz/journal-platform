import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useJournalStore } from "@/lib/store/store";

/**
 * Payments aren't wired to the real API yet (Phase 6) — the mock store's
 * payment records don't correspond to real user ids, so gating on them here
 * would block/allow submission creation based on stale, unrelated data. The
 * backend already enforces the real payment requirement server-side
 * (POST /api/submissions 403s with a clear message when unpaid), so until
 * Phase 6 lands, defer to the backend rather than a local (wrong) gate.
 */
export function useAuthorSubmissionAccess() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const paymentSettings = useJournalStore((s) => s.paymentSettings);

  return {
    canCreateSubmission: can("submission", "create"),
    needsPayment: false,
    paymentSettings,
  };
}
