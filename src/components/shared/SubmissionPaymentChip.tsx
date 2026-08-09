import { CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Submission } from "@/lib/store/types";
import { cn } from "@/lib/utils";

interface SubmissionPaymentChipProps {
  submission: Pick<Submission, "status" | "acceptancePaymentVerified">;
  className?: string;
}

export function SubmissionPaymentChip({ submission, className }: SubmissionPaymentChipProps) {
  if (submission.acceptancePaymentVerified) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "shrink-0 gap-1 rounded-lg border-transparent bg-green-100 text-green-800 hover:bg-green-100",
          className,
        )}
      >
        <CircleDollarSign className="h-3 w-3" />
        APC paid
      </Badge>
    );
  }

  if (submission.status === "payment_pending") {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "shrink-0 gap-1 rounded-lg border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100",
          className,
        )}
      >
        <CircleDollarSign className="h-3 w-3" />
        Payment due
      </Badge>
    );
  }

  return null;
}
