import type { Role } from "@/lib/rbac/types";
import type { Submission, SubmissionStatus } from "@/lib/store/types";
import { getHandlingEditorIds, hasHandlingEditors, isHandlingEditorOnSubmission } from "@/lib/workflow/handlingEditors";

export const STATUS_OWNER_ROLES: Record<SubmissionStatus, Role[]> = {
  draft: ["author"],
  submitted: ["editor_in_chief"],
  administrative_review: ["editor_in_chief"],
  assigned: ["handling_editor"],
  under_review: ["reviewer"],
  revision_required: ["author"],
  eic_approval_pending: ["handling_editor"],
  payment_pending: ["author"],
  accepted: ["handling_editor"],
  rejected: ["author"],
  copyediting: ["handling_editor"],
  production: ["handling_editor"],
  scheduled: ["handling_editor"],
  published: ["publisher_admin"],
};

export function getStatusOwnerRoles(status: SubmissionStatus): Role[] {
  return STATUS_OWNER_ROLES[status] ?? [];
}

/** True when the handling editor can act after peer reviews are complete. */
export function isReadyForFinalEditorialDecision(
  submission: Pick<Submission, "status" | "reviewSubmitted" | "editorRecommendation" | "reviewers" | "reviewerId">,
): boolean {
  if (submission.status !== "under_review") return false;
  const reviewsDone =
    submission.reviewSubmitted === true ||
    (submission.reviewers?.filter((r) => r.invitationStatus === "accepted" && r.reviewSubmitted).length ?? 0) >= 2;
  return reviewsDone || !!submission.editorRecommendation;
}

export function shouldRevealParticipantName(roles: Role[]): boolean {
  return roles.includes("author");
}

export interface SubmissionAssignee {
  prefix: string;
  name: string;
  roles: Role[];
}

export function getSubmissionAssignee(
  submission: Pick<
    Submission,
    "status" | "authorId" | "handlingEditorId" | "handlingEditorIds" | "reviewerId" | "layoutEditorId"
  >,
  getUserById: (id: string) => { name: string; roles: Role[] } | undefined,
): SubmissionAssignee | undefined {
  switch (submission.status) {
    case "under_review": {
      const reviewer = submission.reviewerId ? getUserById(submission.reviewerId) : undefined;
      return {
        prefix: "Under review by",
        name: reviewer?.name ?? "Awaiting reviewer assignment",
        roles: reviewer?.roles.filter((role) => role === "reviewer") ?? ["reviewer"],
      };
    }
    case "assigned": {
      const editorIds = getHandlingEditorIds(submission);
      const editorNames = editorIds
        .map((id) => getUserById(id)?.name)
        .filter((name): name is string => !!name);
      const name =
        editorNames.length > 1
          ? `${editorNames.length} handling editors`
          : (editorNames[0] ?? "Awaiting editor assignment");
      return {
        prefix: editorNames.length > 1 ? "Assigned to" : "Assigned to",
        name,
        roles: ["handling_editor"],
      };
    }
    case "revision_required":
    case "eic_approval_pending":
    case "payment_pending":
    case "draft": {
      const author = getUserById(submission.authorId);
      const prefix =
        submission.status === "revision_required"
          ? "Revision with"
          : submission.status === "eic_approval_pending"
            ? "Revision review with"
            : submission.status === "payment_pending"
              ? "Payment due for"
              : "Draft with";
      return {
        prefix,
        name: author?.name ?? "Author",
        roles: author?.roles.filter((role) => role === "author") ?? ["author"],
      };
    }
    case "submitted":
    case "administrative_review":
      return {
        prefix: "Awaiting assignment by",
        name: "Editor in Chief",
        roles: ["editor_in_chief"],
      };
    case "accepted":
    case "copyediting":
    case "production":
    case "scheduled": {
      const editorIds = getHandlingEditorIds(submission);
      const editor = editorIds[0] ? getUserById(editorIds[0]) : undefined;
      return {
        prefix:
          submission.status === "scheduled"
            ? "Scheduled by"
            : submission.status === "production"
              ? "In production with"
              : "Accepted — with",
        name: editor?.name ?? "Handling editor",
        roles: ["handling_editor"],
      };
    }
    case "published":
      return {
        prefix: "Published by",
        name: "Publisher",
        roles: ["publisher_admin"],
      };
    case "rejected": {
      const author = getUserById(submission.authorId);
      return {
        prefix: "Rejected — notified",
        name: author?.name ?? "Author",
        roles: author?.roles.filter((role) => role === "author") ?? ["author"],
      };
    }
    default:
      return undefined;
  }
}

export function needsAdminScreening(status: SubmissionStatus) {
  return status === "submitted" || status === "administrative_review";
}

export function isAssignedHandlingEditor(
  submission: Pick<Submission, "handlingEditorIds" | "handlingEditorId">,
  userId: string | undefined,
) {
  if (!userId) return false;
  return isHandlingEditorOnSubmission(submission, userId);
}

export function canManageAsHandlingEditor(
  submission: Pick<Submission, "handlingEditorIds" | "handlingEditorId" | "status">,
  userId: string | undefined,
  roles: string[],
) {
  if (!userId || !roles.includes("handling_editor")) return false;
  if (isHandlingEditorOnSubmission(submission, userId)) return true;
  // Allow handling editor to accept unassigned manuscripts at "assigned" stage
  if (submission.status === "assigned" && !hasHandlingEditors(submission)) return true;
  return false;
}

export function canActAsHandlingEditor(
  submission: Pick<Submission, "handlingEditorIds" | "handlingEditorId">,
  userId: string | undefined,
  isEditorInChief: boolean,
) {
  if (!userId) return false;
  if (isEditorInChief) return true;
  return isHandlingEditorOnSubmission(submission, userId);
}

export const REVIEW_RECOMMENDATIONS = [
  { value: "accept", label: "Accept" },
  { value: "minor_revision", label: "Minor Revision" },
  { value: "major_revision", label: "Major Revision" },
  { value: "reject", label: "Reject" },
] as const;

/** Canonical workflow order for timeline progress and status comparisons. */
export const WORKFLOW_STATUS_ORDER: SubmissionStatus[] = [
  "draft",
  "submitted",
  "administrative_review",
  "assigned",
  "under_review",
  "revision_required",
  "eic_approval_pending",
  "payment_pending",
  "accepted",
  "copyediting",
  "production",
  "scheduled",
  "published",
  "rejected",
];

export function workflowStatusRank(status?: SubmissionStatus): number {
  if (!status) return -1;
  const index = WORKFLOW_STATUS_ORDER.indexOf(status);
  return index >= 0 ? index : -1;
}

export const WORKFLOW_STAGE_LABELS: Partial<Record<SubmissionStatus, string>> = {
  submitted: "Awaiting Screening",
  administrative_review: "Administrative Screening",
  assigned: "Editor Assignment",
  under_review: "Peer Review",
  revision_required: "Author Revision",
  eic_approval_pending: "Handling Editor Revision Review",
  payment_pending: "Acceptance Payment",
  accepted: "Accepted — Awaiting Payment",
  copyediting: "Copyediting",
  production: "Layout & Production",
  scheduled: "Scheduled for Publication",
  published: "Published",
  rejected: "Rejected",
  draft: "Draft",
};

export type DecisionSlug =
  | "screening-revision"
  | "desk-reject"
  | "minor-revision"
  | "major-revision"
  | "reject"
  | "further-revision"
  | "reject-after-revision"
  | "recommend-minor-revision"
  | "recommend-major-revision"
  | "recommend-reject"
  | "recommend-accept"
  | "review-minor-revision"
  | "review-major-revision"
  | "review-reject";

export interface DecisionConfig {
  title: string;
  description: string;
  submitLabel: string;
  variant: "reject" | "revision";
  mode: "status";
  status: SubmissionStatus;
  activityLabel: string;
}

export interface ReviewDecisionConfig {
  title: string;
  description: string;
  submitLabel: string;
  variant: "reject" | "revision";
  mode: "review";
  recommendation: string;
  activityLabel: string;
}

export interface RecommendationDecisionConfig {
  title: string;
  description: string;
  submitLabel: string;
  variant: "reject" | "revision";
  mode: "recommendation";
  recommendation: string;
  activityLabel: string;
}

export const DECISION_CONFIG: Record<
  DecisionSlug,
  DecisionConfig | ReviewDecisionConfig | RecommendationDecisionConfig
> = {
  "screening-revision": {
    title: "Request Revision",
    description: "Explain what the author needs to fix before administrative screening can continue.",
    submitLabel: "Send Revision Request",
    variant: "revision",
    mode: "status",
    status: "revision_required",
    activityLabel: "Revision requested at screening",
  },
  "desk-reject": {
    title: "Desk Reject",
    description: "Provide the reason for rejecting this submission at screening.",
    submitLabel: "Confirm Desk Reject",
    variant: "reject",
    mode: "status",
    status: "rejected",
    activityLabel: "Desk rejected at screening",
  },
  "minor-revision": {
    title: "Minor Revision",
    description: "Describe the minor changes required from the author.",
    submitLabel: "Request Minor Revision",
    variant: "revision",
    mode: "status",
    status: "revision_required",
    activityLabel: "Minor revision required",
  },
  "major-revision": {
    title: "Major Revision",
    description: "Describe the major changes required from the author.",
    submitLabel: "Request Major Revision",
    variant: "revision",
    mode: "status",
    status: "revision_required",
    activityLabel: "Major revision required",
  },
  reject: {
    title: "Reject Submission",
    description: "Provide the reason for rejecting this submission after review.",
    submitLabel: "Confirm Rejection",
    variant: "reject",
    mode: "status",
    status: "rejected",
    activityLabel: "Rejected after review",
  },
  "further-revision": {
    title: "Request Further Revision",
    description: "Explain what still needs to be revised in the author's resubmission.",
    submitLabel: "Send Revision Request",
    variant: "revision",
    mode: "status",
    status: "revision_required",
    activityLabel: "Further revision requested",
  },
  "reject-after-revision": {
    title: "Reject Submission",
    description: "Provide the reason for rejecting this submission after revision review.",
    submitLabel: "Confirm Rejection",
    variant: "reject",
    mode: "status",
    status: "rejected",
    activityLabel: "Rejected after revision",
  },
  "review-minor-revision": {
    title: "Recommend Minor Revision",
    description: "Share your review comments and any supporting images for the editor and author.",
    submitLabel: "Submit Review",
    variant: "revision",
    mode: "review",
    recommendation: "minor_revision",
    activityLabel: "Minor revision recommended",
  },
  "review-major-revision": {
    title: "Recommend Major Revision",
    description: "Share your review comments and any supporting images for the editor and author.",
    submitLabel: "Submit Review",
    variant: "revision",
    mode: "review",
    recommendation: "major_revision",
    activityLabel: "Major revision recommended",
  },
  "review-reject": {
    title: "Recommend Rejection",
    description: "Share your review comments and any supporting images for the editor and author.",
    submitLabel: "Submit Review",
    variant: "reject",
    mode: "review",
    recommendation: "reject",
    activityLabel: "Rejection recommended",
  },
  "recommend-minor-revision": {
    title: "Recommend Minor Revision",
    description: "Provide your editorial recommendation for the Editor in Chief.",
    submitLabel: "Submit Recommendation",
    variant: "revision",
    mode: "recommendation",
    recommendation: "minor_revision",
    activityLabel: "Minor revision recommended to EIC",
  },
  "recommend-major-revision": {
    title: "Recommend Major Revision",
    description: "Provide your editorial recommendation for the Editor in Chief.",
    submitLabel: "Submit Recommendation",
    variant: "revision",
    mode: "recommendation",
    recommendation: "major_revision",
    activityLabel: "Major revision recommended to EIC",
  },
  "recommend-reject": {
    title: "Recommend Rejection",
    description: "Provide your editorial recommendation for the Editor in Chief.",
    submitLabel: "Submit Recommendation",
    variant: "reject",
    mode: "recommendation",
    recommendation: "reject",
    activityLabel: "Rejection recommended to EIC",
  },
  "recommend-accept": {
    title: "Recommend Acceptance",
    description: "Recommend that this manuscript be accepted for publication.",
    submitLabel: "Submit Recommendation",
    variant: "revision",
    mode: "recommendation",
    recommendation: "accept",
    activityLabel: "Acceptance recommended to EIC",
  },
};

export function isDecisionSlug(value: string | undefined): value is DecisionSlug {
  return !!value && value in DECISION_CONFIG;
}
