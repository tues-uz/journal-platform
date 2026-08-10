import { canAnyRole } from "@/lib/rbac/can";
import type { Role } from "@/lib/rbac/types";
import type { Submission, SubmissionStatus } from "@/lib/store/types";
import type { DecisionSlug } from "@/lib/workflow/submissionActions";
import { isReadyForFinalEditorialDecision, hasAuthorRevisionAwaitingHeReview } from "@/lib/workflow/submissionActions";
import {
  getHandlingEditorIds,
  hasHandlingEditors,
  isHandlingEditorOnSubmission,
} from "@/lib/workflow/handlingEditors";
import { buildReviewerScope, getReviewerSlot, isReviewerOnSubmission } from "@/lib/workflow/reviewers";

const SCREENING_STATUSES: SubmissionStatus[] = ["submitted", "administrative_review"];
const PRODUCTION_STATUSES: SubmissionStatus[] = [
  "accepted",
  "copyediting",
  "production",
  "scheduled",
  "published",
];

function hasElevatedAccess(roles: Role[]) {
  return roles.some((r) => ["publisher_admin", "editor_in_chief"].includes(r));
}

export function buildSubmissionScope(submission: Submission, userId: string) {
  return {
    submissionAuthorId: submission.authorId,
    handlingEditorId: submission.handlingEditorId,
    handlingEditorIds: getHandlingEditorIds(submission),
    currentUserId: userId,
    submissionStatus: submission.status,
    ...buildReviewerScope(submission, userId),
  };
}

export function canViewSubmission(
  submission: Submission,
  roles: Role[],
  userId: string,
): boolean {
  if (roles.includes("publisher_admin")) return true;

  if (submission.authorId === userId && roles.includes("author")) {
    return true;
  }

  if (roles.includes("editor_in_chief")) {
    return true;
  }

  if (roles.includes("editorial_staff") && SCREENING_STATUSES.includes(submission.status)) {
    return true;
  }

  if (
    roles.includes("editorial_staff") &&
    canAnyRole(roles, "plagiarism", "view") &&
    submission.status === "administrative_review"
  ) {
    return true;
  }

  if (roles.includes("handling_editor") && isHandlingEditorOnSubmission(submission, userId)) {
    return true;
  }

  if (
    roles.includes("handling_editor") &&
    submission.status === "assigned" &&
    !hasHandlingEditors(submission)
  ) {
    return true;
  }

  if (
    roles.includes("reviewer") &&
    isReviewerOnSubmission(submission, userId)
  ) {
    return true;
  }

  if (roles.includes("author") && submission.status === "payment_pending" && submission.authorId === userId) {
    return true;
  }

  if (
    roles.includes("handling_editor") &&
    isHandlingEditorOnSubmission(submission, userId) &&
    (submission.status === "production" ||
      submission.status === "accepted" ||
      submission.status === "scheduled" ||
      submission.proofReady)
  ) {
    return true;
  }

  if (
    roles.includes("production_editor") &&
    (submission.status === "production" || submission.status === "accepted" || submission.proofReady) &&
    (submission.layoutEditorId === userId || !submission.layoutEditorId)
  ) {
    return true;
  }

  if (
    roles.includes("copyeditor") &&
    (submission.status === "accepted" || submission.status === "copyediting")
  ) {
    return true;
  }

  if (
    roles.includes("layout_editor") &&
    (submission.status === "production" || submission.proofReady) &&
    (submission.layoutEditorId === userId || !submission.layoutEditorId)
  ) {
    return true;
  }

  if (submission.status === "published" && roles.includes("author") && submission.authorId === userId) {
    return true;
  }

  if (submission.status === "published" && roles.includes("publisher_admin")) {
    return true;
  }

  if (hasElevatedAccess(roles) && PRODUCTION_STATUSES.includes(submission.status)) {
    return roles.includes("publisher_admin");
  }

  return false;
}

const SCREENING_DECISIONS: DecisionSlug[] = ["screening-revision", "desk-reject"];
const HE_DECISIONS: DecisionSlug[] = ["minor-revision", "major-revision", "reject"];
const HE_REVISION_DECISIONS: DecisionSlug[] = ["further-revision", "reject-after-revision"];
const REVIEW_DECISIONS: DecisionSlug[] = [
  "review-minor-revision",
  "review-major-revision",
  "review-reject",
];

export function canPerformDecision(
  submission: Submission,
  decision: DecisionSlug,
  roles: Role[],
  userId: string,
): boolean {
  const scope = buildSubmissionScope(submission, userId);

  if (SCREENING_DECISIONS.includes(decision)) {
    return (
      SCREENING_STATUSES.includes(submission.status) &&
      canAnyRole(roles, "admin_screening", "decide")
    );
  }

  if (REVIEW_DECISIONS.includes(decision)) {
    const slot = getReviewerSlot(submission, userId);
    return (
      submission.status === "under_review" &&
      !!slot &&
      slot.invitationStatus === "accepted" &&
      !slot.reviewSubmitted &&
      canAnyRole(roles, "peer_review", "decide", scope)
    );
  }

  if (HE_DECISIONS.includes(decision)) {
    const reviewsComplete =
      submission.status === "under_review" && isReadyForFinalEditorialDecision(submission);
    const revisionReview = hasAuthorRevisionAwaitingHeReview(submission);
    return (
      (reviewsComplete || revisionReview) &&
      canAnyRole(roles, "editorial_decision", "decide", scope)
    );
  }

  if (HE_REVISION_DECISIONS.includes(decision)) {
    if (hasAuthorRevisionAwaitingHeReview(submission)) {
      return canAnyRole(roles, "editorial_decision", "decide", scope);
    }
    return false;
  }

  if (
    decision === "recommend-accept" ||
    decision === "recommend-minor-revision" ||
    decision === "recommend-major-revision" ||
    decision === "recommend-reject"
  ) {
    return false;
  }

  return false;
}
