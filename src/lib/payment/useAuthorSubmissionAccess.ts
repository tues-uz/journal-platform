import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import {
  canAuthorCreateSubmission,
  hasApprovedPayment,
  isPureAuthor,
} from "@/lib/payment/access";
import { useJournalStore } from "@/lib/store/store";

export function useAuthorSubmissionAccess() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const payments = useJournalStore((s) => s.payments);
  const paymentSettings = useJournalStore((s) => s.paymentSettings);

  const canCreateByRbac = can("submission", "create");
  const canCreateByPayment = user
    ? canAuthorCreateSubmission(user, payments, paymentSettings)
    : false;

  const needsPayment =
    !!user &&
    paymentSettings.enabled &&
    isPureAuthor(user.roles) &&
    !hasApprovedPayment(user.id, payments);

  return {
    canCreateSubmission: canCreateByRbac && canCreateByPayment,
    needsPayment,
    paymentSettings,
  };
}
