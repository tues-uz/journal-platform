import { PaymentProofPreview } from "@/components/shared/PaymentProofPreview";
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
import type { PaymentRequest, StoreUser } from "@/lib/store/types";

function shortPaymentId(id: string): string {
  const parts = id.split("-");
  return parts.length > 1 ? `#${parts[parts.length - 1].slice(0, 8).toUpperCase()}` : `#${id.slice(0, 8).toUpperCase()}`;
}

interface PaymentListTableProps {
  payments: PaymentRequest[];
  getUserById: (id: string) => StoreUser | undefined;
  emptyMessage: string;
  onReview?: (payment: PaymentRequest) => void;
  showAuthor?: boolean;
  showReviewAction?: boolean;
}

export function PaymentListTable({
  payments,
  getUserById,
  emptyMessage,
  onReview,
  showAuthor = true,
  showReviewAction = true,
}: PaymentListTableProps) {
  const columnCount =
    1 +
    (showAuthor ? 1 : 0) +
    5 +
    1 +
    (showReviewAction && onReview ? 1 : 0);

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
            payments.map((payment) => {
              const author = getUserById(payment.authorId);
              const reviewer = payment.reviewedBy ? getUserById(payment.reviewedBy) : undefined;

              return (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs text-gray-600">
                    {shortPaymentId(payment.id)}
                  </TableCell>
                  {showAuthor && (
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{author?.name ?? "Unknown"}</p>
                        <p className="text-xs text-gray-500">{author?.email ?? payment.authorId}</p>
                      </div>
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
                    <p className="text-xs text-gray-600 truncate max-w-[120px]" title={payment.proofFile.name}>
                      {payment.proofFile.name}
                    </p>
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
                        {reviewer && (
                          <p className="text-xs text-gray-500 truncate max-w-[140px]">{reviewer.name}</p>
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
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { shortPaymentId };
