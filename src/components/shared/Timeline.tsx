import { Circle, MapPin } from "lucide-react";
import { RoleChip, RoleChipList } from "@/components/shared/RoleChip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ROLE_LABELS } from "@/lib/rbac/types";
import type { Role } from "@/lib/rbac/types";
import type { Submission, SubmissionStatus } from "@/lib/store/types";
import {
  getSubmissionAssignee,
  shouldRevealParticipantName,
  WORKFLOW_STAGE_LABELS,
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

function findCurrentEntryIndex(
  entries: TimelineEntry[],
  currentStatus?: SubmissionStatus,
): number {
  if (!currentStatus) return -1;
  return entries.findIndex((entry) => entry.statusAfter === currentStatus);
}

function formatEntryTitle(entry: TimelineEntry): string {
  if (entry.statusAfter && entry.title.toLowerCase().includes("status changed")) {
    return WORKFLOW_STAGE_LABELS[entry.statusAfter] ?? entry.title;
  }
  return entry.title;
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
    <div className="mb-8 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4 sm:p-5">
      <div className="flex items-center gap-2 text-blue-700 mb-3">
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide">Where your submission is now</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {primaryRole && <RoleChip role={primaryRole} className="px-2.5 py-1 text-sm" />}
          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-900">
              {WORKFLOW_STAGE_LABELS[submission.status] ?? "In progress"}
            </p>
          </div>
        </div>
        <StatusBadge status={submission.status} className="self-start sm:self-center" />
      </div>
    </div>
  );
}

function ActorPanel({
  label,
  name,
  roles,
  tone = "neutral",
}: {
  label: string;
  name?: string;
  roles?: Role[];
  tone?: "neutral" | "active";
}) {
  const showName = name && roles && shouldRevealParticipantName(roles);

  return (
    <div
      className={cn(
        "rounded-lg px-3 py-3",
        tone === "active" ? "bg-blue-50 ring-1 ring-blue-100" : "bg-gray-50",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wide mb-2",
          tone === "active" ? "text-blue-600" : "text-gray-400",
        )}
      >
        {label}
      </p>
      {showName && <p className="text-sm font-medium text-gray-900 mb-2">{name}</p>}
      {roles && roles.length > 0 ? (
        <RoleChipList roles={roles} />
      ) : (
        <p className="text-sm text-gray-500">—</p>
      )}
    </div>
  );
}

function formatDescription(entry: TimelineEntry): string | undefined {
  if (!entry.description || entry.description === entry.actorName) return undefined;
  if (entry.description.startsWith("Assigned to ")) {
    const role = entry.actorRoles?.[0];
    return role ? `${ROLE_LABELS[role]} assigned` : "Assignment updated";
  }
  return entry.description;
}

function TimelineEntryCard({
  entry,
  isCurrent,
  isLast,
  assignee,
}: {
  entry: TimelineEntry;
  isCurrent: boolean;
  isLast: boolean;
  assignee?: ReturnType<typeof getSubmissionAssignee>;
}) {
  const title = formatEntryTitle(entry);
  const description = formatDescription(entry);

  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center pt-1">
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2",
            isCurrent
              ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200"
              : "border-gray-200 bg-white",
          )}
        >
          {isCurrent ? (
            <Circle className="h-3 w-3 fill-current" />
          ) : (
            <Circle className="h-2.5 w-2.5 text-gray-300" />
          )}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-gray-200 min-h-[1.5rem]" />}
      </div>

      <div className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-8")}>
        <div
          className={cn(
            isCurrent && "rounded-xl border border-blue-200 bg-white p-4 shadow-sm",
            !isCurrent && "pt-0.5",
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              {isCurrent && (
                <span className="mb-1.5 inline-block rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  Current step
                </span>
              )}
              <h4 className="text-sm font-semibold text-gray-900 leading-snug">{title}</h4>
              {entry.statusAfter && !isCurrent && (
                <div className="mt-1.5">
                  <StatusBadge status={entry.statusAfter} className="text-xs" />
                </div>
              )}
            </div>
            <time className="text-xs text-gray-400 whitespace-nowrap sm:pt-0.5">
              {formatTimestamp(entry.timestamp)}
            </time>
          </div>

          {description && (
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
          )}

          {isCurrent && assignee ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ActorPanel
                label="Performed by"
                name={entry.actorName}
                roles={entry.actorRoles}
                tone="neutral"
              />
              <ActorPanel
                label="Now with"
                name={assignee.name}
                roles={assignee.roles}
                tone="active"
              />
            </div>
          ) : (
            !isCurrent &&
            entry.actorRoles &&
            entry.actorRoles.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {entry.actorName && shouldRevealParticipantName(entry.actorRoles) && (
                  <span className="text-sm font-medium text-gray-900">{entry.actorName}</span>
                )}
                <RoleChipList roles={entry.actorRoles} />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function Timeline({
  entries,
  currentStatus,
  submission,
  getUserById,
  showStatusBanner = false,
  className,
}: TimelineProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">No activity yet.</p>;
  }

  const currentEntryIndex = findCurrentEntryIndex(entries, currentStatus);
  const assignee =
    submission && getUserById ? getSubmissionAssignee(submission, getUserById) : undefined;

  return (
    <div className={cn(className)}>
      {showStatusBanner && submission && getUserById && (
        <TimelineStatusBanner submission={submission} getUserById={getUserById} />
      )}

      <div className="space-y-0">
        {entries.map((entry, index) => (
          <TimelineEntryCard
            key={entry.id}
            entry={entry}
            isCurrent={index === currentEntryIndex}
            isLast={index === entries.length - 1}
            assignee={index === currentEntryIndex ? assignee : undefined}
          />
        ))}
      </div>
    </div>
  );
}
