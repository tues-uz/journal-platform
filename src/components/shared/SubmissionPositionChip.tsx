import { CircleDot, UserRound } from "lucide-react";
import { RoleChip } from "@/components/shared/RoleChip";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Role } from "@/lib/rbac/types";
import type { Submission } from "@/lib/store/types";
import { getSubmissionAssignee, shouldRevealParticipantName, WORKFLOW_STAGE_LABELS } from "@/lib/workflow/submissionActions";
import { cn } from "@/lib/utils";

interface SubmissionPositionChipProps {
  submission: Pick<
    Submission,
    "status" | "authorId" | "handlingEditorId" | "reviewerId" | "apcPaymentState"
  >;
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
  const stageLabel = WORKFLOW_STAGE_LABELS[submission.status] ?? "In progress";

  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card p-5",
        className,
      )}
    >
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-200/80 bg-orange-50/80">
            <CircleDot className="h-4 w-4 text-orange-600" strokeWidth={2} />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">Current stage</p>
            <p className="text-sm font-semibold tracking-tight text-foreground">{stageLabel}</p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border/60 pt-5 sm:border-t-0 sm:pt-0">
          {showName ? (
            <UserAvatar
              name={assignee.name}
              className="h-10 w-10 shrink-0"
              fallbackClassName="text-sm font-medium"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
              <UserRound className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Current position</p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">{assignee.prefix}</span>
              {showName ? (
                <>
                  <span className="font-medium text-foreground">{assignee.name}</span>
                  {primaryRole ? <RoleChip role={primaryRole} /> : null}
                </>
              ) : primaryRole ? (
                <RoleChip role={primaryRole} />
              ) : (
                <span className="font-medium text-foreground">{assignee.name}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
