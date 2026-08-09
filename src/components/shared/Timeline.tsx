import { useMemo } from "react";
import { Check } from "lucide-react";
import { ROLE_LABELS } from "@/lib/rbac/types";
import type { Role } from "@/lib/rbac/types";
import type { Submission, SubmissionStatus } from "@/lib/store/types";
import {
  getSubmissionAssignee,
  shouldRevealParticipantName,
  WORKFLOW_STAGE_LABELS,
  workflowStatusRank,
} from "@/lib/workflow/submissionActions";
import { cn } from "@/lib/utils";

export interface TimelineEntry {
  id: string;
  title: string;
  actorName?: string;
  actorRoles?: Role[];
  statusAfter?: SubmissionStatus;
  description?: string;
  timestamp: string;
}

interface TimelineProps {
  entries: TimelineEntry[];
  currentStatus?: SubmissionStatus;
  submission?: Pick<Submission, "status" | "authorId" | "handlingEditorId" | "reviewerId">;
  getUserById?: (id: string) => { name: string; roles: Role[] } | undefined;
  showStatusBanner?: boolean;
  className?: string;
}

type StepState = "complete" | "current" | "default";

function findCurrentMilestoneIndex(
  entries: TimelineEntry[],
  currentStatus?: SubmissionStatus,
): number {
  if (!currentStatus || entries.length === 0) return -1;

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index].statusAfter === currentStatus) return index;
  }

  const targetRank = workflowStatusRank(currentStatus);
  if (targetRank < 0) return entries.length - 1;

  let bestIndex = -1;
  let bestRank = -1;
  for (let index = 0; index < entries.length; index += 1) {
    const rank = workflowStatusRank(entries[index].statusAfter);
    if (rank >= 0 && rank <= targetRank && rank >= bestRank) {
      bestRank = rank;
      bestIndex = index;
    }
  }

  return bestIndex >= 0 ? bestIndex : entries.length - 1;
}

function findPhaseEnd(entries: TimelineEntry[], milestoneIndex: number): number {
  for (let index = milestoneIndex + 1; index < entries.length; index += 1) {
    if (entries[index].statusAfter) return index - 1;
  }
  return entries.length - 1;
}

function formatEntryTitle(entry: TimelineEntry): string {
  if (entry.statusAfter && entry.title.toLowerCase().includes("status changed")) {
    return WORKFLOW_STAGE_LABELS[entry.statusAfter] ?? entry.title;
  }
  return entry.title;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

function formatDescription(entry: TimelineEntry): string | undefined {
  if (!entry.description || entry.description === entry.actorName) return undefined;
  if (entry.description.startsWith("Assigned to ")) {
    const role = entry.actorRoles?.[0];
    return role ? `${ROLE_LABELS[role]} assigned` : "Assignment updated";
  }
  return entry.description;
}

function formatActorLine(entry: TimelineEntry): string | undefined {
  const role = entry.actorRoles?.[0];
  if (!role) return entry.actorName;

  const roleLabel = ROLE_LABELS[role];
  const showName = entry.actorName && shouldRevealParticipantName(entry.actorRoles);
  return showName ? `${entry.actorName} · ${roleLabel}` : roleLabel;
}

function TimelineStatusBanner({
  submission,
  getUserById,
}: {
  submission: Pick<Submission, "status" | "authorId" | "handlingEditorId" | "reviewerId">;
  getUserById: (id: string) => { name: string; roles: Role[] } | undefined;
}) {
  const assignee = getSubmissionAssignee(submission, getUserById);
  if (!assignee) return null;

  const primaryRole = assignee.roles[0];

  return (
    <div className="mb-6 rounded-lg border border-border/80 bg-card px-4 py-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Current stage</p>
        <p className="text-sm font-medium text-foreground">
          {WORKFLOW_STAGE_LABELS[submission.status] ?? "In progress"}
        </p>
        {primaryRole ? (
          <p className="text-sm text-muted-foreground">
            {shouldRevealParticipantName(assignee.roles)
              ? `${assignee.name} · ${ROLE_LABELS[primaryRole]}`
              : ROLE_LABELS[primaryRole]}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TimelineStepDot({ state }: { state: StepState }) {
  if (state === "current") {
    return (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-card">
        <div className="h-2 w-2 rounded-full bg-orange-500" aria-hidden />
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card text-foreground">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card">
      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" aria-hidden />
    </div>
  );
}

function TimelineEntryRow({
  entry,
  stepState,
  isLast,
}: {
  entry: TimelineEntry;
  stepState: StepState;
  isLast: boolean;
}) {
  const title = formatEntryTitle(entry);
  const description = formatDescription(entry);
  const actorLine = formatActorLine(entry);

  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center self-stretch">
        <TimelineStepDot state={stepState} />
        {!isLast ? <div className="mt-1 w-px flex-1 bg-border/80 min-h-[1rem]" /> : null}
      </div>

      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-6")}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h4
            className={cn(
              "font-sans text-sm font-medium leading-snug",
              stepState === "current" ? "text-orange-600" : "text-foreground",
            )}
          >
            {title}
          </h4>
          <time className="shrink-0 text-xs text-muted-foreground">{formatTimestamp(entry.timestamp)}</time>
        </div>

        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}

        {actorLine ? <p className="mt-1.5 text-xs text-muted-foreground">{actorLine}</p> : null}
      </div>
    </li>
  );
}

function getStepState(
  index: number,
  entries: TimelineEntry[],
  currentMilestoneIndex: number,
): StepState {
  if (currentMilestoneIndex < 0) {
    return index === entries.length - 1 ? "current" : "default";
  }

  const phaseEnd = findPhaseEnd(entries, currentMilestoneIndex);

  if (index < currentMilestoneIndex) return "complete";
  if (index >= currentMilestoneIndex && index <= phaseEnd) {
    return index === phaseEnd ? "current" : "complete";
  }
  return "default";
}

export function Timeline({
  entries,
  currentStatus,
  submission,
  getUserById,
  showStatusBanner = false,
  className,
}: TimelineProps) {
  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
    [entries],
  );

  if (sortedEntries.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  const currentMilestoneIndex = findCurrentMilestoneIndex(sortedEntries, currentStatus);

  return (
    <div className={cn(className)}>
      {showStatusBanner && submission && getUserById ? (
        <TimelineStatusBanner submission={submission} getUserById={getUserById} />
      ) : null}

      <ol className="m-0 list-none p-0" aria-label="Submission activity">
        {sortedEntries.map((entry, index) => (
          <TimelineEntryRow
            key={entry.id}
            entry={entry}
            stepState={getStepState(index, sortedEntries, currentMilestoneIndex)}
            isLast={index === sortedEntries.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}
