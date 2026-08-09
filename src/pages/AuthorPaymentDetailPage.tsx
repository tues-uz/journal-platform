import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { FileUpload, type UploadedFileMeta } from "@/components/shared/FileUpload";
import { PaymentProofPreview } from "@/components/shared/PaymentProofPreview";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { formatPaymentAmount } from "@/lib/payment/access";
import { formatPaymentDate } from "@/lib/payment/authorPaymentDisplay";
import { paymentsApi } from "@/lib/api/payments";
import { submissionsApi } from "@/lib/api/submissions";
import { ApiClientError } from "@/lib/api/client";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";

const AuthorPaymentDetailPage = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [proofFiles, setProofFiles] = useState<UploadedFileMeta[]>([]);
  const [referenceNote, setReferenceNote] = useState("");

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

  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => submissionsApi.get(submissionId as string),
    enabled: !!user && !!submissionId,
  });

  const submitMutation = useMutation({
    mutationFn: ({ file, note }: { file: File; note?: string }) => paymentsApi.submitProof(file, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["submissions"] });
      void queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });
      toast({
        title: "Payment proof submitted",
        description: "An admin will verify your transfer before production begins.",
      });
      navigate(routes.payment);
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Unable to submit payment.";
      toast({ title: "Submit failed", description: message, variant: "destructive" });
    },
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

  if (!can("author_payment", "view")) {
    return <Navigate to={routes.dashboard} replace />;
  }

  if (!submissionId) {
    return <Navigate to={routes.payment} replace />;
  }

  if (!isLoading && (!submission || submission.authorId !== user?.id)) {
    return <Navigate to={routes.payment} replace />;
  }

  const latestPayment = authorPayments[0];
  const hasPendingReview = authorPayments.some((payment) => payment.status === "pending_review");
  const isPaymentDue = submission?.status === "payment_pending";
  const canSubmit =
    can("author_payment", "create") &&
    isPaymentDue &&
    !hasPendingReview &&
    paymentSettings?.enabled;

  const feeLabel =
    paymentSettings && paymentSettings.enabled
      ? formatPaymentAmount(paymentSettings.amount, paymentSettings.currency)
      : null;

  const handleSubmit = () => {
    if (!submission || proofFiles.length === 0 || !proofFiles[0].file) {
      toast({ title: "Please upload your transfer proof.", variant: "destructive" });
      return;
    }

    const note =
      referenceNote.trim() || `APC — ${submission.submissionNumber} — ${submission.title}`;

    submitMutation.mutate({ file: proofFiles[0].file, note });
  };

  if (!submission) {
    return (
      <AuthenticatedLayout breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Payments", href: routes.payment }, { label: "…" }]}>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Payments", href: routes.payment },
        { label: submission.submissionNumber },
      ]}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-4 h-8 rounded-lg px-2 text-muted-foreground hover:text-foreground"
          >
            <Link to={routes.payment}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All payments
            </Link>
          </Button>

          <p className="font-mono text-xs text-muted-foreground">{submission.submissionNumber}</p>
          <h1 className="mt-1 font-sans text-2xl font-semibold tracking-tight text-foreground">
            {submission.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPaymentDue
              ? "Pay the article processing charge to continue to layout."
              : "This manuscript is not awaiting payment."}
          </p>
        </div>

        {latestPayment?.status === "pending_review" && (
          <div className="rounded-lg border border-border/80 bg-card px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">Payment under review</p>
              <PaymentStatusBadge status="pending_review" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Submitted {formatPaymentDate(latestPayment.submittedAt)}. An admin will verify your
              transfer before production begins.
            </p>
            {latestPayment.referenceNote && (
              <p className="mt-2 text-xs text-muted-foreground">
                Reference: {latestPayment.referenceNote}
              </p>
            )}
            <div className="mt-3">
              <PaymentProofPreview paymentId={latestPayment.id} />
            </div>
          </div>
        )}

        {latestPayment?.status === "rejected" && isPaymentDue && (
          <div className="rounded-lg border border-border/80 bg-card px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">Payment rejected</p>
              <PaymentStatusBadge status="rejected" />
            </div>
            {latestPayment.rejectionReason && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {latestPayment.rejectionReason}
              </p>
            )}
          </div>
        )}

        {!isPaymentDue && (
          <div className="rounded-lg border border-border/80 bg-card px-4 py-4">
            <p className="text-sm text-muted-foreground">
              Current status:{" "}
              <span className="font-medium text-foreground">{submission.status.replace(/_/g, " ")}</span>.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
              <Link to={routes.submissionById(submission.id)}>Open submission</Link>
            </Button>
          </div>
        )}

        {canSubmit && paymentSettings && (
          <>
            <div className="overflow-hidden rounded-lg border border-border/80 bg-card">
              <div className="border-b border-border/80 px-4 py-3">
                <h2 className="text-sm font-medium text-foreground">Bank transfer</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Transfer {feeLabel} using the account below.
                </p>
              </div>
              <dl className="divide-y divide-border/80 px-4">
                {[
                  ["Bank", paymentSettings.bankName],
                  ["Account name", paymentSettings.accountName],
                  ["Account number", paymentSettings.accountNumber],
                  ["Amount", feeLabel],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4"
                  >
                    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                    <dd
                      className={`text-sm text-foreground ${label === "Account number" ? "font-mono" : ""}`}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {paymentSettings.transferInstructions && (
                <p className="border-t border-border/80 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {paymentSettings.transferInstructions}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/80 bg-card px-4 py-4">
              <h2 className="text-sm font-medium text-foreground">Upload transfer proof</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Screenshot or PDF of your bank transfer receipt.
              </p>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="referenceNote" className="text-xs text-muted-foreground">
                    Transfer reference (optional)
                  </Label>
                  <Input
                    id="referenceNote"
                    value={referenceNote}
                    onChange={(event) => setReferenceNote(event.target.value)}
                    placeholder="Transfer date or bank reference"
                    className="h-9 rounded-lg border-border/80 bg-background text-sm"
                  />
                </div>
                <FileUpload
                  label="Transfer proof"
                  accept={{
                    "image/*": [".png", ".jpg", ".jpeg", ".webp"],
                    "application/pdf": [".pdf"],
                  }}
                  files={proofFiles}
                  onChange={setProofFiles}
                  maxFiles={1}
                  hint="PNG, JPG, or PDF — 1 file"
                  addMoreLabel="Replace proof"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="h-9 rounded-lg px-4 text-sm"
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending || proofFiles.length === 0}
                  >
                    {submitMutation.isPending ? "Submitting…" : "Submit proof"}
                  </Button>
                  <Button asChild variant="outline" className="h-9 rounded-lg px-4 text-sm">
                    <Link to={routes.payment}>Cancel</Link>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default AuthorPaymentDetailPage;
