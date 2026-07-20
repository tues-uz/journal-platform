import { getRoleModulePermissions } from "@/lib/rbac/permissions";
import type { Module, Permission, Role, ScopeContext } from "@/lib/rbac/types";

function isAssignedHandlingEditor(context?: ScopeContext): boolean {
  return (
    !!context?.currentUserId &&
    !!context.handlingEditorId &&
    context.handlingEditorId === context.currentUserId
  );
}

function isAssignedOrPendingReviewer(context?: ScopeContext): boolean {
  if (!context?.currentUserId) return false;
  if (context.isAssignedReviewer === true) return true;
  if (context.reviewerId === context.currentUserId) return true;
  if (context.pendingReviewerId === context.currentUserId) return true;
  return false;
}

function isSubmissionAuthor(context?: ScopeContext): boolean {
  return (
    !!context?.currentUserId &&
    !!context.submissionAuthorId &&
    context.submissionAuthorId === context.currentUserId
  );
}

function checkScopedPermission(
  module: Module,
  permission: Permission,
  context?: ScopeContext,
): boolean {
  if (!context?.currentUserId) return false;

  switch (module) {
    case "submission":
    case "revision":
      return permission === "view" && isSubmissionAuthor(context);
    case "peer_review":
      if (permission === "view") {
        return isAssignedOrPendingReviewer(context) || isAssignedHandlingEditor(context);
      }
      return (
        (permission === "create" ||
          permission === "edit" ||
          permission === "decide") &&
        isAssignedOrPendingReviewer(context) &&
        context.reviewerId === context.currentUserId
      );
    case "editorial_recommendation":
      return (
        (permission === "view" || permission === "decide") &&
        isAssignedHandlingEditor(context)
      );
    case "editorial_decision":
      return permission === "view" && isSubmissionAuthor(context);
    case "publication":
    case "proofreading":
      return (
        (permission === "view" || permission === "edit" || permission === "decide") &&
        isSubmissionAuthor(context)
      );
    default:
      return false;
  }
}

export function canRole(
  role: Role,
  module: Module,
  permission: Permission,
  context?: ScopeContext,
): boolean {
  const perms = getRoleModulePermissions(role, module);
  const value = perms?.[permission];
  if (!value) return false;
  if (value === "scoped") return checkScopedPermission(module, permission, context);
  return value === true;
}

export function canAnyRole(
  roles: Role[],
  module: Module,
  permission: Permission,
  context?: ScopeContext,
): boolean {
  return roles.some((role) => canRole(role, module, permission, context));
}

export function canViewModule(roles: Role[]): Module[] {
  const modules: Module[] = [
    "profile",
    "submission",
    "admin_screening",
    "plagiarism",
    "editor_assignment",
    "reviewer_assignment",
    "reviewer_invitation",
    "peer_review",
    "revision",
    "editorial_decision",
    "editorial_recommendation",
    "copyediting",
    "layout_production",
    "proofreading",
    "volume_issue",
    "publication",
    "doi_management",
    "website_content",
    "reports",
    "audit_trail",
    "user_management",
    "system_config",
    "author_payment",
  ];

  return modules.filter((module) => canAnyRole(roles, module, "view"));
}
