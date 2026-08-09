import { describe, expect, it } from "vitest";
import { canAnyRole, canRole } from "@/lib/rbac/can";
import { getVisibleNavItems } from "@/lib/rbac/navItems";
import type { Module, Permission, Role } from "@/lib/rbac/types";

function canForRoles(roles: Role[]) {
  return (module: Module, permission: Permission) => canAnyRole(roles, module, permission);
}

describe("getVisibleNavItems", () => {
  it("shows PRD-aligned nav for authors", () => {
    const items = getVisibleNavItems(["author"], canForRoles(["author"]));
    expect(items.map((item) => item.labelKey)).toEqual([
      "nav.dashboard",
      "nav.mySubmissions",
      "nav.payments",
      "nav.notifications",
      "nav.profile",
    ]);
  });

  it("shows PRD-aligned nav for editor in chief", () => {
    const items = getVisibleNavItems(["editor_in_chief"], canForRoles(["editor_in_chief"]));
    expect(items.map((item) => item.labelKey)).toEqual([
      "nav.dashboard",
      "nav.allSubmissions",
      "nav.notifications",
    ]);
  });

  it("shows PRD-aligned nav for handling editor", () => {
    const items = getVisibleNavItems(["handling_editor"], canForRoles(["handling_editor"]));
    expect(items.map((item) => item.labelKey)).toEqual([
      "nav.dashboard",
      "nav.assignedSubmissions",
      "nav.productionQueue",
      "nav.reviewerAssignment",
      "nav.reviewMonitoring",
      "nav.notifications",
    ]);
  });

  it("shows PRD-aligned nav for reviewers", () => {
    const items = getVisibleNavItems(["reviewer"], canForRoles(["reviewer"]));
    expect(items.map((item) => item.labelKey)).toEqual([
      "nav.dashboard",
      "nav.assignedReviews",
      "nav.notifications",
    ]);
  });

  it("shows minimal nav for legacy production editors", () => {
    const items = getVisibleNavItems(["production_editor"], canForRoles(["production_editor"]));
    expect(items.map((item) => item.labelKey)).toEqual(["nav.dashboard", "nav.notifications"]);
  });

  it("shows PRD-aligned nav for publisher admin", () => {
    const items = getVisibleNavItems(["publisher_admin"], canForRoles(["publisher_admin"]));
    expect(items.map((item) => item.labelKey)).toEqual([
      "nav.dashboard",
      "nav.payments",
      "nav.publication",
      "nav.issues",
      "nav.doiManagement",
      "nav.users",
      "nav.settings",
      "nav.notifications",
    ]);
  });
});

describe("RBAC can()", () => {
  it("allows author to create submissions", () => {
    expect(canRole("author", "submission", "create")).toBe(true);
  });

  it("denies reviewer access to copyediting", () => {
    expect(canRole("reviewer", "copyediting", "view")).toBe(false);
  });

  it("denies EIC admin screening", () => {
    expect(canRole("editor_in_chief", "admin_screening", "decide")).toBe(false);
  });

  it("allows handling editor layout access when scoped", () => {
    expect(
      canRole("handling_editor", "layout_production", "decide", {
        currentUserId: "user-he",
        handlingEditorId: "user-he",
        handlingEditorIds: ["user-he"],
      }),
    ).toBe(true);
  });

  it("allows publisher admin full user management", () => {
    expect(canAnyRole(["publisher_admin"], "user_management", "assign")).toBe(true);
  });

  it("denies EIC user management", () => {
    expect(canRole("editor_in_chief", "user_management", "view")).toBe(false);
  });

  it("allows handling editor submission list access", () => {
    expect(canRole("handling_editor", "submission", "view")).toBe(true);
  });
});
