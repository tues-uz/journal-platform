import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { PaymentListTable } from "@/components/shared/PaymentListTable";
import { PaymentProofPreview } from "@/components/shared/PaymentProofPreview";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { formatPaymentAmount } from "@/lib/payment/access";
import { paymentsApi, type ManagedPayment } from "@/lib/api/payments";
import { ApiClientError } from "@/lib/api/client";
import type { PaymentStatus } from "@/lib/store/types";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";

type FilterStatus = PaymentStatus | "all";

const AdminPaymentsPage = () => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", "all"],
    queryFn: () => paymentsApi.listAll(),
    enabled: !!user && can("author_payment", "view"),
  });

  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<ManagedPayment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) =>
      paymentsApi.review(id, approve, reason),
    onSuccess: (_updated, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: variables.approve ? "Payment approved." : "Payment rejected." });
      setSelectedPayment(null);
      setShowRejectForm(false);
      setRejectReason("");
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Unable to review payment.";
      toast({ title: "Review failed", description: message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    let list =
      filter === "all" ? payments : payments.filter((payment) => payment.status === filter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (payment) =>
          payment.id.includes(q) ||
          payment.referenceNote?.toLowerCase().includes(q) ||
          payment.authorName.toLowerCase().includes(q),
      );
    }

    return [...list].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }, [payments, filter, search]);

  if (!can("author_payment", "view")) {
    return <Navigate to={routes.dashboard} replace />;
  }

  const pendingCount = payments.filter((p) => p.status === "pending_review").length;

  const handleApprove = () => {
    if (!selectedPayment) return;
    reviewMutation.mutate({ id: selectedPayment.id, approve: true });
  };

  const handleReject = () => {
    if (!selectedPayment || !rejectReason.trim()) {
      toast({ title: "Please provide a rejection reason.", variant: "destructive" });
      return;
    }
    reviewMutation.mutate({ id: selectedPayment.id, approve: false, reason: rejectReason.trim() });
  };

  const filterButtons: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending_review", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const emptyMessage =
    filter === "all" && !search.trim()
      ? "No payment records yet. Submissions appear here when authors upload transfer proofs."
      : filter === "pending_review"
        ? "No payment proofs are waiting for review."
        : "No payment records match your search or filter.";

  return (
    <AuthenticatedLayout
      title="Payments"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Payments" }]}
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {filterButtons.map((item) => (
          <Button
            key={item.value}
            variant={filter === item.value ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setFilter(item.value)}
          >
            {item.label}
            {item.value === "pending_review" && pendingCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
                {pendingCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by author, reference, or payment ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md rounded-xl"
        />
      </div>

      <PaymentListTable
        payments={filtered}
        emptyMessage={emptyMessage}
        onReview={(payment) => {
          setSelectedPayment(payment);
          setShowRejectForm(false);
          setRejectReason("");
        }}
      />

      <Dialog
        open={!!selectedPayment}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPayment(null);
            setShowRejectForm(false);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>Payment Review</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium text-gray-700">Author:</span>{" "}
                  {selectedPayment.authorName}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Amount:</span>{" "}
                  {formatPaymentAmount(selectedPayment.amount, selectedPayment.currency)}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Submitted:</span>{" "}
                  {new Date(selectedPayment.submittedAt).toLocaleString()}
                </p>
                {selectedPayment.referenceNote && (
                  <p>
                    <span className="font-medium text-gray-700">Reference:</span>{" "}
                    {selectedPayment.referenceNote}
                  </p>
                )}
                <div className="pt-1">
                  <PaymentStatusBadge status={selectedPayment.status} />
                </div>
              </div>

              <PaymentProofPreview paymentId={selectedPayment.id} />

              {selectedPayment.status === "rejected" && selectedPayment.rejectionReason && (
                <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3">
                  {selectedPayment.rejectionReason}
                </p>
              )}

              {selectedPayment.status === "pending_review" && can("author_payment", "decide") && (
                <>
                  {showRejectForm ? (
                    <div className="space-y-2">
                      <Label htmlFor="rejectReason">Rejection reason</Label>
                      <Textarea
                        id="rejectReason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain why the payment proof was rejected"
                        className="rounded-xl"
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {selectedPayment?.status === "pending_review" && can("author_payment", "decide") && (
              <>
                {showRejectForm ? (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={reviewMutation.isPending}
                      onClick={() => setShowRejectForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="rounded-xl"
                      disabled={reviewMutation.isPending}
                      onClick={handleReject}
                    >
                      {reviewMutation.isPending ? "Rejecting..." : "Confirm Reject"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={reviewMutation.isPending}
                      onClick={() => setShowRejectForm(true)}
                    >
                      Reject
                    </Button>
                    <Button className="rounded-xl" disabled={reviewMutation.isPending} onClick={handleApprove}>
                      {reviewMutation.isPending ? "Approving..." : "Approve"}
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
};

export default AdminPaymentsPage;
