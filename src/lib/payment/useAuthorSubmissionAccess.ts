import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { paymentsApi } from "@/lib/api/payments";
import { isPureAuthor } from "@/lib/payment/access";

export function useAuthorSubmissionAccess() {
  const { user } = useAuth();
  const { can } = usePermissions();

  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => paymentsApi.getSettings(),
    enabled: !!user,
  });

  const paymentGated = !!user && !!paymentSettings?.enabled && isPureAuthor(user.roles);

  const { data: ownPayments = [] } = useQuery({
    queryKey: ["payments", "all"],
    queryFn: () => paymentsApi.listAll(),
    enabled: paymentGated,
    select: (payments) => payments.filter((p) => p.authorId === user?.id),
  });

  const latestPayment = [...ownPayments].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )[0];

  return {
    canCreateSubmission: can("submission", "create"),
    /** Submission is free; APC is paid after acceptance (see payment_pending). */
    needsPayment: false,
    paymentSettings,
    latestPayment,
  };
}
