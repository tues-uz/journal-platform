import type { Module, Permission, Role } from "@/lib/rbac/types";

type PermissionSet = Partial<Record<Permission, boolean | "scoped">>;

const matrix: Record<Module, Partial<Record<Role, PermissionSet>>> = {
  profile: {
    author: { view: true, create: true, edit: true },
    editorial_staff: { view: true, edit: true },
    editor_in_chief: { view: true, edit: true },
    handling_editor: { view: true, edit: true },
    reviewer: { view: true, edit: true },
    copyeditor: { view: true, edit: true },
    layout_editor: { view: true, edit: true },
    publisher_admin: { view: true, create: true, edit: true, assign: true },
  },
  submission: {
    author: { view: true, create: true, edit: true },
    editorial_staff: { view: true },
    editor_in_chief: { view: true },
    handling_editor: { view: true },
    reviewer: { view: true },
    publisher_admin: { view: true, assign: true },
  },
  admin_screening: {
    editorial_staff: { view: true, edit: true, decide: true },
    publisher_admin: { view: true },
  },
  plagiarism: {
    editorial_staff: { view: true, edit: true, decide: true },
    publisher_admin: { view: true },
  },
  editor_assignment: {
    editor_in_chief: { view: true, assign: true },
    publisher_admin: { view: true, assign: true },
  },
  reviewer_assignment: {
    handling_editor: { view: true, assign: true },
    publisher_admin: { view: true, assign: true },
  },
  reviewer_invitation: {
    reviewer: { view: true, decide: true },
    publisher_admin: { view: true },
  },
  peer_review: {
    editor_in_chief: { view: true },
    handling_editor: { view: true },
    reviewer: { view: true, create: "scoped", edit: "scoped", decide: "scoped" },
    publisher_admin: { view: true },
  },
  revision: {
    author: { view: true, create: true, edit: true },
    editor_in_chief: { view: true },
    handling_editor: { view: true },
    publisher_admin: { view: true },
  },
  editorial_decision: {
    author: { view: "scoped" },
    editor_in_chief: { view: true, decide: true },
    publisher_admin: { view: true, decide: true },
  },
  editorial_recommendation: {
    handling_editor: { view: true, decide: "scoped" },
    editor_in_chief: { view: true },
    publisher_admin: { view: true },
  },
  copyediting: {
    copyeditor: { view: true, create: true, edit: true, decide: true },
    publisher_admin: { view: true },
  },
  layout_production: {
    layout_editor: { view: true, create: true, edit: true, decide: true },
    publisher_admin: { view: true },
  },
  proofreading: {
    author: { view: "scoped", edit: "scoped", decide: "scoped" },
    publisher_admin: { view: true },
  },
  volume_issue: {
    publisher_admin: { view: true, create: true, edit: true, assign: true },
  },
  publication: {
    author: { view: "scoped" },
    publisher_admin: { view: true, edit: true, publish: true },
  },
  doi_management: {
    publisher_admin: { view: true, create: true, edit: true },
  },
  website_content: {
    publisher_admin: { view: true, create: true, edit: true, publish: true },
  },
  reports: {
    publisher_admin: { view: true, assign: true },
  },
  audit_trail: {
    editor_in_chief: { view: true },
    publisher_admin: { view: true, assign: true },
  },
  user_management: {
    publisher_admin: { view: true, create: true, edit: true, assign: true },
  },
  system_config: {
    publisher_admin: { view: true, create: true, edit: true, assign: true },
  },
  author_payment: {
    author: { view: true, create: true },
    editorial_staff: { view: true },
    publisher_admin: { view: true, decide: true, edit: true },
  },
};

export function getRoleModulePermissions(role: Role, module: Module): PermissionSet | undefined {
  return matrix[module]?.[role];
}

export function getModulePermissions(module: Module): Partial<Record<Role, PermissionSet>> {
  return matrix[module] ?? {};
}
