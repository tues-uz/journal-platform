import type { Role } from "@/lib/rbac/types";
import type { Submission, SubmissionStatus } from "@/lib/store/types";

export const STATUS_OWNER_ROLES: Record<SubmissionStatus, Role[]> = {
  draft: ["author"],
  submitted: ["editorial_staff"],
  administrative_review: ["editorial_staff"],
  assigned: ["handling_editor"],
  under_review: ["reviewer"],
  revision_required: ["author"],
  accepted: ["copyeditor"],
  rejected: ["author"],
  copyediting: ["copyeditor"],
  production: ["layout_editor"],
  published: ["publisher_admin"],
};

export function getStatusOwnerRoles(status: SubmissionStatus): Role[] {
  return STATUS_OWNER_ROLES[status] ?? [];
}

/** True when the EIC can make an accept/reject/revision final decision. */
export function isReadyForFinalEditorialDecision(
  submission: Pick<Submission, "status" | "reviewSubmitted" | "editorRecommendation">,
): boolean {
  return (
    submission.status === "under_review" &&
    (submission.reviewSubmitted === true || !!submission.editorRecommendation)
  );
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
    "status" | "authorId" | "handlingEditorId" | "reviewerId" | "layoutEditorId"
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
      const editor = submission.handlingEditorId
        ? getUserById(submission.handlingEditorId)
        : undefined;
      return {
        prefix: "Assigned to",
        name: editor?.name ?? "Awaiting editor assignment",
        roles: editor?.roles.filter((role) => role === "handling_editor") ?? ["handling_editor"],
      };
    }
    case "revision_required":
    case "draft": {
      const author = getUserById(submission.authorId);
      return {
        prefix: submission.status === "revision_required" ? "Revision with" : "Draft with",
        name: author?.name ?? "Author",
        roles: author?.roles.filter((role) => role === "author") ?? ["author"],
      };
    }
    case "submitted":
    case "administrative_review":
      return {
        prefix: "Screening by",
        name: "Editorial office",
        roles: ["editorial_staff"],
      };
    case "accepted":
      return {
        prefix: "Accepted — awaiting",
        name: "Copyediting",
        roles: ["copyeditor"],
      };
    case "copyediting":
      return {
        prefix: "Copyediting with",
        name: "Copyeditor",
        roles: ["copyeditor"],
      };
    case "production": {
      const layoutEditor = submission.layoutEditorId
        ? getUserById(submission.layoutEditorId)
        : undefined;
      return {
        prefix: layoutEditor ? "In production with" : "Awaiting",
        name: layoutEditor?.name ?? "Layout editor assignment",
        roles: layoutEditor?.roles.filter((role) => role === "layout_editor") ?? ["layout_editor"],
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
  handlingEditorId: string | undefined,
  userId: string | undefined,
) {
  return !!userId && handlingEditorId === userId;
}

export function canManageAsHandlingEditor(
  submission: Pick<Submission, "handlingEditorId" | "status">,
  userId: string | undefined,
  roles: string[],
) {
  if (!userId || !roles.includes("handling_editor")) return false;
  if (submission.handlingEditorId === userId) return true;
  // Allow handling editor to accept unassigned manuscripts at "assigned" stage
  if (submission.status === "assigned" && !submission.handlingEditorId) return true;
  return false;
}

export function canActAsHandlingEditor(
  handlingEditorId: string | undefined,
  userId: string | undefined,
  isEditorInChief: boolean,
) {
  if (!userId) return false;
  if (isEditorInChief) return true;
  return handlingEditorId === userId;
}

export const REVIEW_RECOMMENDATIONS = [
  { value: "accept", label: "Accept" },
  { value: "minor_revision", label: "Minor Revision" },
  { value: "major_revision", label: "Major Revision" },
  { value: "reject", label: "Reject" },
] as const;

export const WORKFLOW_STAGE_LABELS: Partial<Record<SubmissionStatus, string>> = {
  submitted: "Awaiting Screening",
  administrative_review: "Administrative Screening",
  assigned: "Editor Assignment",
  under_review: "Peer Review",
  revision_required: "Author Revision",
  accepted: "Accepted — Production Queue",
  copyediting: "Copyediting",
  production: "Layout & Production",
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
