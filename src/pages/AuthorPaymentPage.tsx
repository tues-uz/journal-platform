import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { FileUpload, type UploadedFileMeta } from "@/components/shared/FileUpload";
import { PaymentListTable } from "@/components/shared/PaymentListTable";
import { PaymentProofPreview } from "@/components/shared/PaymentProofPreview";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { formatPaymentAmount } from "@/lib/payment/access";
import { paymentsApi } from "@/lib/api/payments";
import { ApiClientError } from "@/lib/api/client";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";

const AuthorPaymentPage = () => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const [proofFiles, setProofFiles] = useState<UploadedFileMeta[]>([]);
  const [referenceNote, setReferenceNote] = useState("");

  const submitMutation = useMutation({
    mutationFn: ({ file, note }: { file: File; note?: string }) => paymentsApi.submitProof(file, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Payment proof submitted.", description: "An admin will review it shortly." });
      setProofFiles([]);
      setReferenceNote("");
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

  const latestPayment = authorPayments[0];

  const canSubmit =
    can("author_payment", "create") &&
    (!latestPayment ||
      latestPayment.status === "rejected");

  const handleSubmit = () => {
    if (proofFiles.length === 0 || !proofFiles[0].file) {
      toast({ title: "Please upload your transfer proof.", variant: "destructive" });
      return;
    }
    submitMutation.mutate({ file: proofFiles[0].file, note: referenceNote.trim() || undefined });
  };

  return (
    <AuthenticatedLayout
      title="Submission Fee"
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Submission Fee" },
      ]}
    >
      {paymentSettings && !paymentSettings.enabled && (
        <Card className="rounded-xl shadow-sm mb-6 border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <p className="text-sm text-green-800">
              Submission fees are currently disabled. You can create submissions without payment.
            </p>
            <Button asChild className="rounded-xl mt-4">
              <Link to={routes.submissionCreate}>Create Submission</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {latestPayment?.status === "approved" && (
        <Card className="rounded-xl shadow-sm mb-6 border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-lg">Payment Approved</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Your submission access is unlocked. You can now submit manuscripts.
                </p>
              </div>
              <PaymentStatusBadge status="approved" />
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-xl">
              <Link to={routes.submissionCreate}>Create Submission</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {latestPayment?.status === "pending_review" && (
        <Card className="rounded-xl shadow-sm mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-amber-600" />
              <div>
                <CardTitle className="text-lg">Payment Under Review</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Submitted {new Date(latestPayment.submittedAt).toLocaleString()}
                </p>
              </div>
              <PaymentStatusBadge status="pending_review" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Your transfer proof is being reviewed by the journal admin. You will be notified once
              it is approved.
            </p>
            {latestPayment.referenceNote && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Reference:</span> {latestPayment.referenceNote}
              </p>
            )}
            <PaymentProofPreview paymentId={latestPayment.id} />
          </CardContent>
        </Card>
      )}

      {latestPayment?.status === "rejected" && (
        <Card className="rounded-xl shadow-sm mb-6 border-red-200 bg-red-50/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle className="text-lg">Payment Rejected</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Please review the reason below and submit a new transfer proof.
                </p>
              </div>
              <PaymentStatusBadge status="rejected" />
            </div>
          </CardHeader>
          {latestPayment.rejectionReason && (
            <CardContent>
              <p className="text-sm text-red-800 whitespace-pre-wrap">{latestPayment.rejectionReason}</p>
            </CardContent>
          )}
        </Card>
      )}

      {canSubmit && paymentSettings && paymentSettings.enabled && (
        <>
          <Card className="rounded-xl shadow-sm mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    One-time fee: {formatPaymentAmount(paymentSettings.amount, paymentSettings.currency)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 first:pt-0">
                  <dt className="text-sm font-medium text-gray-500">Bank</dt>
                  <dd className="text-sm text-gray-900 sm:col-span-2">{paymentSettings.bankName}</dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3">
                  <dt className="text-sm font-medium text-gray-500">Account Name</dt>
                  <dd className="text-sm text-gray-900 sm:col-span-2">{paymentSettings.accountName}</dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3">
                  <dt className="text-sm font-medium text-gray-500">Account Number</dt>
                  <dd className="text-sm text-gray-900 sm:col-span-2 font-mono">
                    {paymentSettings.accountNumber}
                  </dd>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3">
                  <dt className="text-sm font-medium text-gray-500">Amount</dt>
                  <dd className="text-sm text-gray-900 sm:col-span-2">
                    {formatPaymentAmount(paymentSettings.amount, paymentSettings.currency)}
                  </dd>
                </div>
              </dl>
              {paymentSettings.transferInstructions && (
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                  {paymentSettings.transferInstructions}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upload Transfer Proof</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Upload a screenshot or PDF of your bank transfer receipt.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referenceNote">Transfer reference (optional)</Label>
                <Input
                  id="referenceNote"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  placeholder="e.g. transfer date or bank reference number"
                  className="rounded-xl"
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
              <Button
                className="rounded-xl"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || proofFiles.length === 0}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Payment Proof"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="rounded-xl shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
          <p className="text-sm text-gray-500 mt-1">All transfer proofs you have submitted</p>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <PaymentListTable
            payments={authorPayments}
            showAuthor={false}
            showReviewAction={false}
            emptyMessage="No payment records yet. Submit a transfer proof above to get started."
          />
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
};

export default AuthorPaymentPage;
