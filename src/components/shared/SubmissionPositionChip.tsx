import { MapPin } from "lucide-react";
import { RoleChip } from "@/components/shared/RoleChip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Role } from "@/lib/rbac/types";
import type { Submission } from "@/lib/store/types";
import { getSubmissionAssignee, shouldRevealParticipantName, WORKFLOW_STAGE_LABELS } from "@/lib/workflow/submissionActions";
import { cn } from "@/lib/utils";

interface SubmissionPositionChipProps {
  submission: Pick<Submission, "status" | "authorId" | "handlingEditorId" | "reviewerId">;
  getUserById: (id: string) => { name: string; roles: Role[] } | undefined;
  showLabel?: boolean;
  className?: string;
}

export function SubmissionPositionChip({
  submission,
  getUserById,
  showLabel = true,
  className,
}: SubmissionPositionChipProps) {
  const assignee = getSubmissionAssignee(submission, getUserById);
  if (!assignee) return null;

  const primaryRole = assignee.roles[0];
  const showName = shouldRevealParticipantName(assignee.roles);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {showLabel && (
        <span className="text-xs text-gray-500 whitespace-nowrap">Current position</span>
      )}
      {showName && (
        <span className="text-xs font-medium text-gray-900">{assignee.name}</span>
      )}
      {primaryRole && <RoleChip role={primaryRole} />}
    </div>
  );
}

export function SubmissionPositionSummary({
  submission,
  getUserById,
  className,
}: Omit<SubmissionPositionChipProps, "showLabel">) {
  const assignee = getSubmissionAssignee(submission, getUserById);
  if (!assignee) return null;

  const primaryRole = assignee.roles[0];
  const showName = shouldRevealParticipantName(assignee.roles);

  return (
    <div
      className={cn(
        "rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-blue-700 mb-3">
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide">Where your submission is now</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {primaryRole && <RoleChip role={primaryRole} className="px-2.5 py-1 text-sm" />}
          <div className="min-w-0">
            {showName && (
              <p className="text-base font-semibold text-gray-900 truncate">{assignee.name}</p>
            )}
            <p className={cn("font-semibold text-gray-900", showName ? "text-sm text-gray-500" : "text-base")}>
              {WORKFLOW_STAGE_LABELS[submission.status] ?? "In progress"}
            </p>
          </div>
        </div>
        <StatusBadge status={submission.status} className="self-start sm:self-center" />
      </div>
    </div>
  );
}
