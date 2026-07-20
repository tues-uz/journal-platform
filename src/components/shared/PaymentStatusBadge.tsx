import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/store/types";

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  pending_review: {
    label: "Pending Review",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={`rounded-lg capitalize ${config.className}`}>
      {config.label}
    </Badge>
  );
}
