import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ClipboardCheck, Search } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/features/auth/useAuth";
import { submissionsApi } from "@/lib/api/submissions";
import { buildUserDirectory } from "@/lib/api/userDirectory";
import { filterSubmissionsForReviews } from "@/lib/store/submissionFilters";
import { isHandlingEditorOnSubmission } from "@/lib/workflow/handlingEditors";
import { isReadyForFinalEditorialDecision, hasAuthorRevisionAwaitingHeReview } from "@/lib/workflow/submissionActions";
import { countSubmittedReviews, getReviewerSlot } from "@/lib/workflow/reviewers";
import { MIN_REVIEWERS } from "@/lib/store/types";
import { routes } from "@/app/routes";
import { cn } from "@/lib/utils";
import type { Submission } from "@/lib/store/types";

type ReviewFilter = "all" | "invitation" | "active" | "done" | "decide" | "awaiting";
type ReviewTaskState = "invitation" | "active" | "done";
type HandlingEditorMonitorState = "decide" | "await_reviews" | "revision_review";

function getHandlingEditorMonitorState(
  submission: Submission,
  userId: string,
): HandlingEditorMonitorState | null {
  if (!isHandlingEditorOnSubmission(submission, userId)) return null;

  if (hasAuthorRevisionAwaitingHeReview(submission)) {
    return "revision_review";
  }

  if (submission.status === "under_review") {
    return isReadyForFinalEditorialDecision(submission) ? "decide" : "await_reviews";
  }

  return null;
}

function getReviewerTaskState(submission: Submission, userId: string): ReviewTaskState | null {
  const slot = getReviewerSlot(submission, userId);
  if (!slot) return null;
  if (slot.invitationStatus === "pending") return "invitation";
  if (slot.reviewSubmitted) return "done";
  if (slot.invitationStatus === "accepted") return "active";
  return null;
}

const REVIEWER_STATUS_LABEL: Record<ReviewTaskState, string> = {
  invitation: "Respond",
  active: "Review",
  done: "Submitted",
};

const HE_MONITOR_STATUS_LABEL: Record<HandlingEditorMonitorState, string> = {
  decide: "Decide",
  await_reviews: "Awaiting reviews",
  revision_review: "Review revision",
};

function isHandlingEditorView(roles: string[]) {
  return roles.includes("handling_editor");
}

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState<ReviewFilter>("all");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions", user?.id],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const getUserById = useMemo(() => buildUserDirectory(submissions), [submissions]);

  const isEditorMonitor = !!user && isHandlingEditorView(user.roles);

  const reviews = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForReviews(submissions, user.id, user.roles);
  }, [submissions, user]);

  const taskCounts = useMemo(() => {
    if (!user) return { all: 0, invitation: 0, active: 0, done: 0, decide: 0, awaiting: 0 };
    const counts = { all: reviews.length, invitation: 0, active: 0, done: 0, decide: 0, awaiting: 0 };

    for (const submission of reviews) {
      if (isEditorMonitor) {
        const state = getHandlingEditorMonitorState(submission, user.id);
        if (state === "decide") counts.decide += 1;
        if (state === "await_reviews") counts.awaiting += 1;
        if (state === "revision_review") counts.decide += 1;
        continue;
      }

      const state = getReviewerTaskState(submission, user.id);
      if (state) counts[state] += 1;
    }

    return counts;
  }, [reviews, user, isEditorMonitor]);

  const filtered = useMemo(() => {
    if (!user) return [];
    let list = [...reviews];

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter(
        (submission) =>
          submission.title.toLowerCase().includes(query) ||
          submission.submissionNumber.toLowerCase().includes(query) ||
          (submission.authorName?.toLowerCase().includes(query) ?? false),
      );
    }

    if (taskFilter !== "all") {
      list = list.filter((submission) => {
        if (isEditorMonitor) {
          const state = getHandlingEditorMonitorState(submission, user.id);
          if (taskFilter === "decide") {
            return state === "decide" || state === "revision_review";
          }
          if (taskFilter === "awaiting") {
            return state === "await_reviews";
          }
          return false;
        }
        return getReviewerTaskState(submission, user.id) === taskFilter;
      });
    }

    if (isEditorMonitor) {
      const priority: Record<HandlingEditorMonitorState, number> = {
        decide: 0,
        revision_review: 1,
        await_reviews: 2,
      };

      return list.sort((a, b) => {
        const stateA = getHandlingEditorMonitorState(a, user.id);
        const stateB = getHandlingEditorMonitorState(b, user.id);
        const rankA = stateA ? priority[stateA] : 9;
        const rankB = stateB ? priority[stateB] : 9;
        if (rankA !== rankB) return rankA - rankB;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    const priority: Record<ReviewTaskState, number> = {
      invitation: 0,
      active: 1,
      done: 2,
    };

    return list.sort((a, b) => {
      const stateA = getReviewerTaskState(a, user.id);
      const stateB = getReviewerTaskState(b, user.id);
      const rankA = stateA ? priority[stateA] : 9;
      const rankB = stateB ? priority[stateB] : 9;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [reviews, search, taskFilter, user, isEditorMonitor]);

  const filters: Array<{ value: ReviewFilter; label: string }> = isEditorMonitor
    ? [
        { value: "all", label: "All" },
        { value: "decide", label: "Ready to decide" },
        { value: "awaiting", label: "Awaiting reviews" },
      ]
    : [
        { value: "all", label: "All" },
        { value: "invitation", label: "Invitations" },
        { value: "active", label: "In progress" },
        { value: "done", label: "Submitted" },
      ];

  return (
    <AuthenticatedLayout
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Reviews" }]}
    >
      <div className="mx-auto w-full max-w-3xl pb-8">
        <header className="mb-6">
          <h1 className="font-sans text-xl font-semibold tracking-tight text-foreground">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditorMonitor
              ? `${reviews.length} in peer review${
                  taskCounts.decide > 0 ? ` · ${taskCounts.decide} ready for your decision` : ""
                }`
              : `${reviews.length} assigned${
                  taskCounts.invitation > 0 ? ` · ${taskCounts.invitation} awaiting response` : ""
                }`}
          </p>
        </header>

        {reviews.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.5}
              />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 rounded-md border-border/80 bg-background pl-9 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {filters.map((option) => {
                const count = taskCounts[option.value];
                if (option.value !== "all" && count === 0) return null;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTaskFilter(option.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      taskFilter === option.value
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {option.label}
                    <span className="ml-1 tabular-nums opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No reviews"
            description="Manuscripts assigned to you will appear here."
          />
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No matches.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/80 bg-card">
            <ul className="divide-y divide-border/60">
              {filtered.map((submission) => {
                if (!user) return null;

                const editorState = isEditorMonitor
                  ? getHandlingEditorMonitorState(submission, user.id)
                  : null;
                const reviewerState = !isEditorMonitor
                  ? getReviewerTaskState(submission, user.id)
                  : null;

                if (!editorState && !reviewerState) return null;

                const author = getUserById(submission.authorId);
                const statusLabel = editorState
                  ? HE_MONITOR_STATUS_LABEL[editorState]
                  : REVIEWER_STATUS_LABEL[reviewerState!];
                const highlight = editorState
                  ? editorState === "decide" || editorState === "revision_review"
                  : reviewerState === "invitation";

                return (
                  <li key={submission.id}>
                    <Link
                      to={routes.submissionById(submission.id)}
                      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {submission.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {submission.submissionNumber}
                          <span className="mx-1.5 text-border/80">·</span>
                          {author?.name ?? submission.authorName ?? "Author"}
                          <span className="mx-1.5 text-border/80">·</span>
                          {formatUpdatedAt(submission.updatedAt)}
                          {editorState === "await_reviews" ? (
                            <>
                              <span className="mx-1.5 text-border/80">·</span>
                              {countSubmittedReviews(submission)}/{MIN_REVIEWERS} reviews in
                            </>
                          ) : null}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "text-xs",
                            highlight
                              ? "font-medium text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {statusLabel}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/60"
                          strokeWidth={1.5}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
