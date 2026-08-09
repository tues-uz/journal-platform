import type { ReviewerAssignment, Submission } from "@/lib/store/types";
import { MIN_REVIEWERS } from "@/lib/store/types";

export function getReviewerSlots(submission: Pick<Submission, "reviewers" | "reviewerId" | "pendingReviewerId" | "reviewerInvitationStatus" | "reviewSubmitted">): ReviewerAssignment[] {
  if (submission.reviewers?.length) {
    return submission.reviewers;
  }
  const legacy: ReviewerAssignment[] = [];
  if (submission.reviewerId) {
    legacy.push({
      reviewerId: submission.reviewerId,
      invitationStatus: submission.reviewerInvitationStatus ?? "accepted",
      reviewSubmitted: submission.reviewSubmitted,
    });
  }
  if (submission.pendingReviewerId) {
    legacy.push({
      reviewerId: submission.pendingReviewerId,
      invitationStatus: "pending",
    });
  }
  return legacy;
}

export function countAcceptedReviewers(submission: Pick<Submission, "reviewers" | "reviewerId" | "pendingReviewerId" | "reviewerInvitationStatus">): number {
  return getReviewerSlots(submission).filter((r) => r.invitationStatus === "accepted").length;
}

export function countSubmittedReviews(submission: Pick<Submission, "reviewers" | "reviewerId" | "reviewSubmitted">): number {
  return getReviewerSlots(submission).filter((r) => r.reviewSubmitted).length;
}

export function hasMinimumReviews(submission: Pick<Submission, "reviewers" | "reviewerId" | "reviewSubmitted">): boolean {
  return countSubmittedReviews(submission) >= MIN_REVIEWERS;
}

export function countActiveReviewerInvites(
  submission: Pick<Submission, "reviewers" | "reviewerId" | "pendingReviewerId" | "reviewerInvitationStatus">,
): number {
  return getReviewerSlots(submission).filter((slot) => slot.invitationStatus !== "declined").length;
}

export function canInviteMoreReviewers(
  submission: Pick<Submission, "reviewers" | "reviewerId" | "pendingReviewerId" | "reviewerInvitationStatus">,
): boolean {
  return countActiveReviewerInvites(submission) < MIN_REVIEWERS;
}

export function hasPendingInvitation(submission: Pick<Submission, "reviewers" | "pendingReviewerId">): boolean {
  if (submission.pendingReviewerId) return true;
  return getReviewerSlots(submission).some((r) => r.invitationStatus === "pending");
}

export function getActiveReviewerIds(submission: Pick<Submission, "reviewers" | "reviewerId">): string[] {
  return getReviewerSlots(submission)
    .filter((r) => r.invitationStatus === "accepted")
    .map((r) => r.reviewerId);
}

export function isReviewerOnSubmission(
  submission: Pick<Submission, "reviewers" | "reviewerId" | "pendingReviewerId">,
  userId: string,
): boolean {
  return getReviewerSlots(submission).some((r) => r.reviewerId === userId);
}

export function getReviewerSlot(
  submission: Pick<Submission, "reviewers" | "reviewerId" | "pendingReviewerId" | "reviewerInvitationStatus" | "reviewSubmitted">,
  userId: string,
): ReviewerAssignment | undefined {
  return getReviewerSlots(submission).find((r) => r.reviewerId === userId);
}

export function allRequiredReviewsComplete(submission: Pick<Submission, "reviewers" | "reviewerId" | "reviewSubmitted">): boolean {
  const slots = getReviewerSlots(submission).filter((r) => r.invitationStatus === "accepted");
  if (slots.length < MIN_REVIEWERS) return false;
  return slots.every((r) => r.reviewSubmitted);
}

/** Permission scope fields for the current user's reviewer slot. */
export function buildReviewerScope(
  submission: Pick<
    Submission,
    "reviewers" | "reviewerId" | "pendingReviewerId" | "reviewerInvitationStatus" | "reviewSubmitted"
  >,
  userId: string,
) {
  const slot = getReviewerSlot(submission, userId);
  if (!slot) {
    return {
      isAssignedReviewer: false as const,
      reviewerId: submission.reviewerId,
      pendingReviewerId: submission.pendingReviewerId,
    };
  }

  return {
    isAssignedReviewer: true as const,
    reviewerSlotStatus: slot.invitationStatus,
    reviewerId:
      slot.invitationStatus === "accepted" ? slot.reviewerId : submission.reviewerId,
    pendingReviewerId:
      slot.invitationStatus === "pending" ? slot.reviewerId : submission.pendingReviewerId,
  };
}
