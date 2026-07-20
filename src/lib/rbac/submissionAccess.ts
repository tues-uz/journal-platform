import { canAnyRole } from "@/lib/rbac/can";
import type { Role } from "@/lib/rbac/types";
import type { Submission, SubmissionStatus } from "@/lib/store/types";
import type { DecisionSlug } from "@/lib/workflow/submissionActions";
import { isReadyForFinalEditorialDecision } from "@/lib/workflow/submissionActions";

const SCREENING_STATUSES: SubmissionStatus[] = ["submitted", "administrative_review"];
const PRODUCTION_STATUSES: SubmissionStatus[] = [
  "accepted",
  "copyediting",
  "production",
  "published",
];

function hasElevatedAccess(roles: Role[]) {
  return roles.some((r) => ["publisher_admin", "editor_in_chief"].includes(r));
}

export function buildSubmissionScope(submission: Submission, userId: string) {
  return {
    submissionAuthorId: submission.authorId,
    handlingEditorId: submission.handlingEditorId,
    reviewerId: submission.reviewerId,
    pendingReviewerId: submission.pendingReviewerId,
    currentUserId: userId,
    isAssignedReviewer: submission.reviewerId === userId,
    submissionStatus: submission.status,
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

  if (roles.includes("handling_editor") && submission.handlingEditorId === userId) {
    return true;
  }

  if (
    roles.includes("handling_editor") &&
    submission.status === "assigned" &&
    !submission.handlingEditorId
  ) {
    return true;
  }

  if (
    roles.includes("reviewer") &&
    (submission.reviewerId === userId || submission.pendingReviewerId === userId)
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
const EIC_DECISIONS: DecisionSlug[] = ["minor-revision", "major-revision", "reject"];
const HE_RECOMMENDATION_DECISIONS: DecisionSlug[] = [
  "recommend-minor-revision",
  "recommend-major-revision",
  "recommend-reject",
  "recommend-accept",
];
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
    return (
      submission.status === "under_review" &&
      submission.reviewerId === userId &&
      submission.reviewerInvitationStatus === "accepted" &&
      canAnyRole(roles, "peer_review", "decide", scope)
    );
  }

  if (EIC_DECISIONS.includes(decision)) {
    return (
      isReadyForFinalEditorialDecision(submission) &&
      canAnyRole(roles, "editorial_decision", "decide")
    );
  }

  if (HE_RECOMMENDATION_DECISIONS.includes(decision)) {
    return (
      submission.status === "under_review" &&
      canAnyRole(roles, "editorial_recommendation", "decide", scope)
    );
  }

  if (HE_REVISION_DECISIONS.includes(decision)) {
    return (
      submission.status === "revision_required" &&
      submission.handlingEditorId === userId &&
      roles.includes("handling_editor")
    );
  }

  return false;
}
