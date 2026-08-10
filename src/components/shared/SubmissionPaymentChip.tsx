import { CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Submission } from "@/lib/store/types";
import {
  getSubmissionApcState,
  type SubmissionApcState,
} from "@/lib/payment/access";
import { cn } from "@/lib/utils";

interface SubmissionPaymentChipProps {
  submission: Pick<
    Submission,
    "status" | "acceptancePaymentVerified" | "authorId" | "apcPaymentState"
  >;
  className?: string;
}

function resolveApcState(
  submission: SubmissionPaymentChipProps["submission"],
): SubmissionApcState {
  if (submission.apcPaymentState) return submission.apcPaymentState;
  if (submission.acceptancePaymentVerified) return "paid";
  if (submission.status === "payment_pending") return "due";
  return "none";
}

export function SubmissionPaymentChip({ submission, className }: SubmissionPaymentChipProps) {
  const apcState = resolveApcState(submission);

  if (apcState === "paid" || submission.acceptancePaymentVerified) {
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

  if (apcState === "pending_review") {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "shrink-0 gap-1 rounded-lg border-transparent bg-sky-100 text-sky-800 hover:bg-sky-100",
          className,
        )}
      >
        <CircleDollarSign className="h-3 w-3" />
        Payment under review
      </Badge>
    );
  }

  if (apcState === "due" || submission.status === "payment_pending") {
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

/** Resolve APC state when only store data is available (e.g. tests). */
export { getSubmissionApcState };
