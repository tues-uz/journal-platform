import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { formatPaymentAmount } from "@/lib/payment/access";
import {
  paymentDescriptionForAuthor,
  paymentMetaDate,
} from "@/lib/payment/authorPaymentDisplay";
import { paymentsApi } from "@/lib/api/payments";
import { submissionsApi } from "@/lib/api/submissions";
import { routes } from "@/app/routes";

const AuthorPaymentPage = () => {
  const { user } = useAuth();
  const { can } = usePermissions();

  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => paymentsApi.getSettings(),
    enabled: !!user,
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ["payments", "all"],
    queryFn: () => paymentsApi.listAll(),
    enabled: !!user,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions", user?.id],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  const authorPayments = useMemo(
    () =>
      user
        ? allPayments
            .filter((payment) => payment.authorId === user.id)
            .sort(
              (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
            )
        : [],
    [user, allPayments],
  );

  const awaitingApcSubmissions = useMemo(
    () =>
      user
        ? submissions.filter(
            (submission) =>
              submission.authorId === user.id && submission.status === "payment_pending",
          )
        : [],
    [submissions, user],
  );

  if (!can("author_payment", "view")) {
    return <Navigate to={routes.dashboard} replace />;
  }

  const feeLabel =
    paymentSettings && paymentSettings.enabled
      ? formatPaymentAmount(paymentSettings.amount, paymentSettings.currency)
      : null;

  const hasPendingReview = authorPayments.some((payment) => payment.status === "pending_review");
  const showEmpty = awaitingApcSubmissions.length === 0 && authorPayments.length === 0;

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Payments" },
      ]}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
            Payments
          </h1>
          <p className="text-sm text-muted-foreground">
            Publication fees for accepted manuscripts.{feeLabel ? ` APC: ${feeLabel}.` : ""}
          </p>
        </div>

        {paymentSettings && !paymentSettings.enabled && (
          <p className="rounded-lg border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground">
            Publication payments are currently disabled.
          </p>
        )}

        {hasPendingReview && (
          <p className="text-sm text-muted-foreground">
            You have a transfer proof awaiting admin review. New uploads unlock after it is
            processed.
          </p>
        )}

        {showEmpty ? (
          <div className="rounded-lg border border-border/80 bg-card px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No payments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When a manuscript is approved for publication, it will appear here for APC payment.
            </p>
            <Link
              to={routes.submissions}
              className="mt-4 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              View my submissions
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/80 bg-card">
            <ul className="divide-y divide-border/80">
              {awaitingApcSubmissions.map((submission) => (
                <li key={submission.id}>
                  <Link
                    to={routes.authorPaymentDetail(submission.id)}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-muted-foreground">
                        {submission.submissionNumber}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                        {submission.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Payment due</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {feeLabel && (
                        <span className="text-sm font-medium tabular-nums text-foreground">
                          {feeLabel}
                        </span>
                      )}
                      <ChevronRight
                        className="h-4 w-4 text-muted-foreground/50"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}

              {authorPayments.map((payment) => (
                <li key={payment.id}>
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {paymentDescriptionForAuthor(payment.referenceNote)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {paymentMetaDate(payment)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-medium tabular-nums text-foreground">
                        {formatPaymentAmount(payment.amount, payment.currency)}
                      </span>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default AuthorPaymentPage;
