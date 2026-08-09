export type Role =
  | "author"
  | "editorial_staff"
  | "editor_in_chief"
  | "handling_editor"
  | "reviewer"
  | "copyeditor"
  | "layout_editor"
  | "production_editor"
  | "publisher_admin";

export type Permission = "view" | "create" | "edit" | "assign" | "decide" | "publish";

export type Module =
  | "profile"
  | "submission"
  | "admin_screening"
  | "plagiarism"
  | "editor_assignment"
  | "reviewer_assignment"
  | "reviewer_invitation"
  | "peer_review"
  | "revision"
  | "editorial_decision"
  | "editorial_recommendation"
  | "he_prescreening"
  | "eic_revision_approval"
  | "copyediting"
  | "layout_production"
  | "proofreading"
  | "volume_issue"
  | "publication"
  | "doi_management"
  | "website_content"
  | "reports"
  | "audit_trail"
  | "user_management"
  | "system_config"
  | "author_payment";

export interface ScopeContext {
  submissionAuthorId?: string;
  handlingEditorId?: string;
  handlingEditorIds?: string[];
  reviewerId?: string;
  pendingReviewerId?: string;
  currentUserId?: string;
  isAssignedReviewer?: boolean;
  reviewerSlotStatus?: "pending" | "accepted" | "declined";
  submissionStatus?: string;
}

export const ALL_ROLES: Role[] = [
  "author",
  "editorial_staff",
  "editor_in_chief",
  "handling_editor",
  "reviewer",
  "copyeditor",
  "layout_editor",
  "production_editor",
  "publisher_admin",
];

/** Roles that can be assigned by admins — authors self-register separately. */
export const ASSIGNABLE_ROLES: Role[] = ALL_ROLES.filter((role) => role !== "author");

export const ROLE_LABELS: Record<Role, string> = {
  author: "Author",
  editorial_staff: "Editorial Staff",
  editor_in_chief: "Editor in Chief",
  handling_editor: "Handling Editor",
  reviewer: "Reviewer",
  copyeditor: "Copyeditor",
  layout_editor: "Layout Editor",
  production_editor: "Production Editor",
  publisher_admin: "Publisher / Admin",
};
