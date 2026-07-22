import { useState } from "react";
import { Download } from "lucide-react";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPaymentAmount } from "@/lib/payment/access";
import { paymentsApi, type ManagedPayment } from "@/lib/api/payments";
import { useToast } from "@/hooks/use-toast";

function shortPaymentId(id: string): string {
  return `#${id.padStart(6, "0")}`;
}

interface PaymentListTableProps {
  payments: ManagedPayment[];
  emptyMessage: string;
  onReview?: (payment: ManagedPayment) => void;
  showAuthor?: boolean;
  showReviewAction?: boolean;
}

export function PaymentListTable({
  payments,
  emptyMessage,
  onReview,
  showAuthor = true,
  showReviewAction = true,
}: PaymentListTableProps) {
  const { toast } = useToast();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const columnCount =
    1 +
    (showAuthor ? 1 : 0) +
    5 +
    1 +
    (showReviewAction && onReview ? 1 : 0);

  const openProof = async (paymentId: string) => {
    setOpeningId(paymentId);
    try {
      const url = await paymentsApi.getProofDownloadUrl(paymentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast({
        title: "Download unavailable",
        description: "Could not get a download link for this proof.",
        variant: "destructive",
      });
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment ID</TableHead>
            {showAuthor && <TableHead>Author</TableHead>}
            <TableHead>Amount</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Proof</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Reviewed</TableHead>
            <TableHead>Status</TableHead>
            {showReviewAction && onReview && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-32 text-center text-sm text-gray-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-mono text-xs text-gray-600">
                  {shortPaymentId(payment.id)}
                </TableCell>
                {showAuthor && (
                  <TableCell>
                    <p className="font-medium text-gray-900">{payment.authorName}</p>
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap">
                  {formatPaymentAmount(payment.amount, payment.currency)}
                </TableCell>
                <TableCell className="max-w-[160px]">
                  <p className="text-sm text-gray-700 truncate" title={payment.referenceNote}>
                    {payment.referenceNote ?? "—"}
                  </p>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-8"
                    disabled={openingId === payment.id}
                    onClick={() => void openProof(payment.id)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </Button>
                </TableCell>
                <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                  {new Date(payment.submittedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {payment.reviewedAt ? (
                    <div>
                      <p className="whitespace-nowrap">
                        {new Date(payment.reviewedAt).toLocaleString()}
                      </p>
                      {payment.reviewedByName && (
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">
                          {payment.reviewedByName}
                        </p>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
                {showReviewAction && onReview && (
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => onReview(payment)}
                    >
                      Review
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { shortPaymentId };
