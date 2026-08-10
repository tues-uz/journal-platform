import type { Role } from "@/lib/rbac/types";
import type { ScopeContext } from "@/lib/rbac/types";
import type { Submission, SubmissionStatus } from "@/lib/store/types";
import { isHandlingEditorOnSubmission } from "@/lib/workflow/handlingEditors";
import { isReadyForFinalEditorialDecision, hasAuthorRevisionAwaitingHeReview } from "@/lib/workflow/submissionActions";
import { getReviewerSlot, isReviewerOnSubmission } from "@/lib/workflow/reviewers";
import { deriveLayoutPhase } from "@/lib/workflow/layoutPhase";

export function filterSubmissionsForUser(
  submissions: Submission[],
  userId: string,
  roles: Role[],
): Submission[] {
  if (roles.includes("publisher_admin") || roles.includes("editor_in_chief")) {
    return submissions;
  }
  if (roles.includes("handling_editor")) {
    return submissions.filter((s) => isHandlingEditorOnSubmission(s, userId));
  }
  if (roles.includes("reviewer")) {
    return submissions.filter((submission) => {
      const slot = getReviewerSlot(submission, userId);
      return !!slot && slot.invitationStatus !== "declined";
    });
  }
  if (roles.includes("production_editor")) {
    return submissions.filter(
      (s) =>
        (s.status === "production" || s.status === "accepted") &&
        (s.layoutEditorId === userId || !s.layoutEditorId),
    );
  }
  if (roles.includes("author")) {
    return submissions.filter((s) => s.authorId === userId);
  }
  return [];
}

function hasElevatedEditorAccess(roles: Role[]) {
  return roles.some((r) =>
    ["publisher_admin", "editor_in_chief", "handling_editor"].includes(r),
  );
}

export function filterSubmissionsForReviews(
  submissions: Submission[],
  userId: string,
  roles: Role[],
): Submission[] {
  if (roles.includes("reviewer") && !hasElevatedEditorAccess(roles)) {
    return submissions.filter((submission) => {
      const slot = getReviewerSlot(submission, userId);
      if (!slot || slot.invitationStatus === "declined") return false;
      if (slot.invitationStatus === "pending") return true;
      return submission.status === "under_review" && slot.invitationStatus === "accepted";
    });
  }

  if (roles.includes("handling_editor") && !roles.includes("publisher_admin")) {
    return submissions.filter(
      (s) =>
        isHandlingEditorOnSubmission(s, userId) &&
        (s.status === "under_review" || s.status === "assigned"),
    );
  }

  if (roles.includes("editor_in_chief") || roles.includes("publisher_admin")) {
    return submissions.filter((s) => s.status === "under_review");
  }

  return [];
}

export function filterSubmissionsForEditorial(
  submissions: Submission[],
  userId: string,
  roles: Role[],
): Submission[] {
  const screeningStatuses: SubmissionStatus[] = ["submitted", "administrative_review"];

  if (roles.includes("editorial_staff")) {
    return submissions.filter((s) => screeningStatuses.includes(s.status));
  }

  if (roles.includes("editor_in_chief") || roles.includes("publisher_admin")) {
    return submissions.filter(
      (s) =>
        s.status === "submitted" ||
        s.status === "assigned" ||
        isReadyForFinalEditorialDecision(s),
    );
  }

  if (roles.includes("handling_editor")) {
    return submissions.filter(
      (s) =>
        isHandlingEditorOnSubmission(s, userId) &&
        (s.status === "assigned" ||
          s.status === "under_review" ||
          s.status === "revision_required" ||
          hasAuthorRevisionAwaitingHeReview(s) ||
          isReadyForFinalEditorialDecision(s)),
    );
  }

  return [];
}

export function filterSubmissionsForPlagiarism(submissions: Submission[]): Submission[] {
  return submissions.filter(
    (s) =>
      s.status === "administrative_review" &&
      (s.plagiarismStatus === "pending" || s.plagiarismStatus === undefined),
  );
}

export function filterSubmissionsForProduction(
  submissions: Submission[],
  roles: Role[],
  userId?: string,
): Submission[] {
  if (roles.includes("handling_editor")) {
    return submissions.filter(
      (s) =>
        (s.status === "production" || s.status === "accepted" || s.status === "scheduled") &&
        isHandlingEditorOnSubmission(s, userId ?? ""),
    );
  }

  if (roles.includes("production_editor")) {
    return submissions.filter(
      (s) =>
        (s.status === "production" || s.status === "accepted") &&
        !s.proofApproved &&
        (s.layoutEditorId === userId || !s.layoutEditorId),
    );
  }

  if (roles.includes("publisher_admin")) {
    return submissions.filter((s) => ["production", "accepted", "scheduled"].includes(s.status));
  }

  return [];
}

export function filterCompletedLayouts(
  submissions: Submission[],
  userId: string,
  roles: Role[],
): Submission[] {
  if (!roles.includes("production_editor") && !roles.includes("publisher_admin")) {
    return [];
  }

  return submissions.filter((s) => {
    if (s.layoutEditorId !== userId && !roles.includes("publisher_admin")) return false;
    const phase = deriveLayoutPhase(s);
    return phase === "completed";
  });
}

export interface LayoutStats {
  assigned: number;
  inProgress: number;
  waitingForProofreading: number;
  completed: number;
}

export function getLayoutStats(submissions: Submission[], userId: string): LayoutStats {
  const assigned = submissions.filter(
    (s) =>
      s.status === "production" &&
      (s.layoutEditorId === userId || !s.layoutEditorId),
  );

  return {
    assigned: assigned.length,
    inProgress: assigned.filter((s) => deriveLayoutPhase(s) === "in_progress").length,
    waitingForProofreading: assigned.filter(
      (s) => deriveLayoutPhase(s) === "ready_for_proofreading",
    ).length,
    completed: submissions.filter(
      (s) => s.layoutEditorId === userId && deriveLayoutPhase(s) === "completed",
    ).length,
  };
}

export function filterLayoutProductionFiles(
  submissions: Submission[],
  roles: Role[],
  userId?: string,
): Submission[] {
  if (roles.includes("production_editor")) {
    return filterCompletedLayouts(submissions, userId ?? "", roles);
  }

  if (roles.includes("publisher_admin")) {
    return submissions.filter(
      (s) => deriveLayoutPhase(s) === "completed" || s.status === "published",
    );
  }

  return [];
}

export function filterPublishedSubmissions(
  submissions: Submission[],
  userId: string,
  roles: Role[],
): Submission[] {
  const published = submissions.filter((s) => s.status === "published");

  if (roles.includes("author") && !roles.includes("publisher_admin")) {
    return published.filter((s) => s.authorId === userId);
  }

  if (roles.includes("publisher_admin")) {
    return published;
  }

  return [];
}

export function filterSubmissionsReadyToPublish(
  submissions: Submission[],
  roles: Role[],
): Submission[] {
  if (!roles.includes("publisher_admin")) return [];

  return submissions.filter(
    (s) => s.status === "production" && s.proofApproved === true,
  );
}

export function filterSubmissionsForReports(
  submissions: Submission[],
  userId: string,
  roles: Role[],
): Submission[] {
  if (roles.includes("publisher_admin")) {
    return submissions;
  }

  return submissions.filter((s) => s.authorId === userId);
}

export function countByStatus(submissions: Submission[]) {
  return submissions.reduce<Partial<Record<SubmissionStatus, number>>>((acc, sub) => {
    acc[sub.status] = (acc[sub.status] ?? 0) + 1;
    return acc;
  }, {});
}
