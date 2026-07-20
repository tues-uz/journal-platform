import { Badge } from "@/components/ui/badge";
import { getStatusLabel, STATUS_CONFIG } from "@/lib/status/config";
import type { SubmissionStatus } from "@/lib/store/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("font-medium border rounded-xl", config.className, className)}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
