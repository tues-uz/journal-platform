import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, FileImage, Loader2 } from "lucide-react";
import { PaymentProofPreview } from "@/components/shared/PaymentProofPreview";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { shortPaymentId } from "@/components/shared/PaymentListTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPaymentAmount } from "@/lib/payment/access";
import {
  formatPaymentDate,
  parsePaymentReferenceNote,
} from "@/lib/payment/authorPaymentDisplay";
import { paymentsApi, type ManagedPayment } from "@/lib/api/payments";
import { cn } from "@/lib/utils";

function isImageProofUrl(url: string): boolean {
  if (url.startsWith("data:image/")) return true;
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);
}

function ProofPanel({ paymentId }: { paymentId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setUrl(null);

    void paymentsApi
      .getProofDownloadUrl(paymentId)
      .then((proofUrl) => {
        if (!cancelled) setUrl(proofUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const openFullSize = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/20">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Transfer proof
        </p>
        {!loading && !failed && url && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={openFullSize}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Open full size
          </Button>
        )}
      </div>

      <div className="flex min-h-[160px] items-center justify-center p-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading proof…
          </div>
        ) : failed ? (
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">Could not load the proof preview.</p>
            <PaymentProofPreview paymentId={paymentId} />
          </div>
        ) : url && isImageProofUrl(url) ? (
          <button
            type="button"
            className="block max-h-56 w-full overflow-hidden rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={openFullSize}
          >
            <img src={url} alt="Payment transfer proof" className="mx-auto max-h-56 w-full object-contain" />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <FileImage className="h-8 w-8 text-muted-foreground/70" />
            <p className="text-sm text-muted-foreground">Preview unavailable for this file type.</p>
            <PaymentProofPreview paymentId={paymentId} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

interface PaymentReviewDialogProps {
  payment: ManagedPayment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canDecide: boolean;
  isPending: boolean;
  showRejectForm: boolean;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
  onShowRejectForm: (show: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
}

export function PaymentReviewDialog({
  payment,
  open,
  onOpenChange,
  canDecide,
  isPending,
  showRejectForm,
  rejectReason,
  onRejectReasonChange,
  onShowRejectForm,
  onApprove,
  onReject,
}: PaymentReviewDialogProps) {
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const reference = parsePaymentReferenceNote(payment?.referenceNote);
  const isPendingReview = payment?.status === "pending_review";
  const showActions = isPendingReview && canDecide;

  const manuscriptLabel = reference.manuscriptNumber
    ? reference.manuscriptTitle
      ? `${reference.manuscriptNumber} · ${reference.manuscriptTitle}`
      : reference.manuscriptNumber
    : payment?.referenceNote;

  useEffect(() => {
    if (!open) setApproveConfirmOpen(false);
  }, [open]);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <div className="space-y-2 pr-6">
            {payment && <PaymentStatusBadge status={payment.status} />}
            <div className="space-y-1">
              <DialogTitle>Review payment proof</DialogTitle>
              <DialogDescription>
                Verify the bank transfer matches the publication fee before approving.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {payment && (
          <div className="space-y-4 px-6 py-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Author">{payment.authorName}</DetailItem>
              <DetailItem label="Amount">
                <span className="font-medium tabular-nums">
                  {formatPaymentAmount(payment.amount, payment.currency)}
                </span>
              </DetailItem>
              <DetailItem label="Submitted">
                {formatPaymentDate(payment.submittedAt)} ·{" "}
                {new Date(payment.submittedAt).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </DetailItem>
              <DetailItem label="Payment ID">{shortPaymentId(payment.id)}</DetailItem>
            </dl>

            {(reference.manuscriptNumber || payment.referenceNote) && (
              <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Manuscript
                </p>
                {reference.manuscriptNumber ? (
                  <p className="mt-1 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {reference.manuscriptNumber}
                    </span>
                    {reference.manuscriptTitle && (
                      <>
                        <span className="mx-1.5 text-muted-foreground">·</span>
                        <span className="font-medium text-foreground">{reference.manuscriptTitle}</span>
                      </>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-foreground">{payment.referenceNote}</p>
                )}
              </div>
            )}

            <ProofPanel paymentId={payment.id} />

            {payment.status === "rejected" && payment.rejectionReason && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-xs font-medium uppercase tracking-wide text-red-700">Rejection reason</p>
                <p className="mt-1 text-sm text-red-800">{payment.rejectionReason}</p>
              </div>
            )}

            {payment.status === "approved" && payment.reviewedAt && (
              <p className="text-xs text-muted-foreground">
                Approved {formatPaymentDate(payment.reviewedAt)}
                {payment.reviewedByName ? ` by ${payment.reviewedByName}` : ""}
              </p>
            )}

            {showActions && showRejectForm && (
              <div className="space-y-2">
                <Label htmlFor="rejectReason">Rejection reason</Label>
                <Textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(event) => onRejectReasonChange(event.target.value)}
                  placeholder="Explain what is wrong with the proof so the author can resubmit."
                  className="min-h-[96px] resize-y"
                />
              </div>
            )}
          </div>
        )}

        {showActions && (
          <DialogFooter className="border-t border-border/60 px-6 py-4">
            {showRejectForm ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => onShowRejectForm(false)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending || !rejectReason.trim()}
                  onClick={onReject}
                >
                  {isPending ? "Rejecting…" : "Confirm reject"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => onShowRejectForm(true)}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  className={cn("bg-green-600 text-white hover:bg-green-700")}
                  onClick={() => setApproveConfirmOpen(true)}
                >
                  Approve payment
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>

    <AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve this payment?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Confirm that the transfer proof is valid. The manuscript will move to production
                once approved.
              </p>
              {payment && (
                <ul className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-foreground">
                  <li>
                    <span className="text-muted-foreground">Author:</span> {payment.authorName}
                  </li>
                  <li>
                    <span className="text-muted-foreground">Amount:</span>{" "}
                    {formatPaymentAmount(payment.amount, payment.currency)}
                  </li>
                  {manuscriptLabel && (
                    <li>
                      <span className="text-muted-foreground">Manuscript:</span> {manuscriptLabel}
                    </li>
                  )}
                </ul>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-green-600 hover:bg-green-700"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onApprove();
            }}
          >
            {isPending ? "Approving…" : "Yes, approve payment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
