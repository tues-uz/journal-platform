import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  PenTool,
  Factory,
  BookOpenCheck,
  Library,
  Users,
  Settings,
  Receipt,
  Bell,
  UserCircle,
  ShieldCheck,
  Gavel,
  UserPlus,
  Link2,
  FolderOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Module, Permission, Role } from "@/lib/rbac/types";
import { routes } from "@/app/routes";

export interface NavItemDef {
  icon: LucideIcon;
  labelKey: string;
  path: string;
  module: Module;
  roles: Role[];
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    icon: LayoutDashboard,
    labelKey: "nav.dashboard",
    path: routes.dashboard,
    module: "profile",
    roles: [
      "author",
      "editor_in_chief",
      "handling_editor",
      "reviewer",
      "production_editor",
      "publisher_admin",
    ],
  },
  {
    icon: FileText,
    labelKey: "nav.mySubmissions",
    path: routes.submissions,
    module: "submission",
    roles: ["author"],
  },
  {
    icon: FileText,
    labelKey: "nav.allSubmissions",
    path: routes.submissions,
    module: "submission",
    roles: ["editor_in_chief"],
  },
  {
    icon: FileText,
    labelKey: "nav.assignedSubmissions",
    path: routes.submissions,
    module: "submission",
    roles: ["handling_editor"],
  },
  {
    icon: Receipt,
    labelKey: "nav.payments",
    path: routes.payment,
    module: "author_payment",
    roles: ["author"],
  },
  {
    icon: Receipt,
    labelKey: "nav.payments",
    path: routes.payments,
    module: "author_payment",
    roles: ["publisher_admin"],
  },
  {
    icon: Factory,
    labelKey: "nav.productionQueue",
    path: routes.production,
    module: "layout_production",
    roles: ["handling_editor"],
  },
  {
    icon: UserPlus,
    labelKey: "nav.reviewerAssignment",
    path: routes.reviewerAssignment,
    module: "reviewer_assignment",
    roles: ["handling_editor"],
  },
  {
    icon: ClipboardCheck,
    labelKey: "nav.reviewMonitoring",
    path: routes.reviews,
    module: "peer_review",
    roles: ["handling_editor"],
  },
  {
    icon: ClipboardCheck,
    labelKey: "nav.assignedReviews",
    path: routes.reviews,
    module: "peer_review",
    roles: ["reviewer"],
  },
  {
    icon: BookOpenCheck,
    labelKey: "nav.publication",
    path: routes.published,
    module: "publication",
    roles: ["publisher_admin"],
  },
  {
    icon: Library,
    labelKey: "nav.issues",
    path: routes.volumes,
    module: "volume_issue",
    roles: ["publisher_admin"],
  },
  {
    icon: Link2,
    labelKey: "nav.doiManagement",
    path: routes.doiManagement,
    module: "doi_management",
    roles: ["publisher_admin"],
  },
  {
    icon: Users,
    labelKey: "nav.users",
    path: routes.users,
    module: "user_management",
    roles: ["publisher_admin"],
  },
  {
    icon: Settings,
    labelKey: "nav.settings",
    path: routes.settings,
    module: "system_config",
    roles: ["publisher_admin"],
  },
  {
    icon: Bell,
    labelKey: "nav.notifications",
    path: routes.notifications,
    module: "profile",
    roles: [
      "author",
      "editor_in_chief",
      "handling_editor",
      "reviewer",
      "production_editor",
      "publisher_admin",
    ],
  },
  {
    icon: UserCircle,
    labelKey: "nav.profile",
    path: routes.profile,
    module: "profile",
    roles: ["author"],
  },
];

export function getVisibleNavItems(
  roles: Role[],
  can: (module: Module, permission: Permission) => boolean,
): NavItemDef[] {
  if (roles.length === 0) return [];

  const seen = new Set<string>();

  return NAV_ITEMS.filter((item) => {
    if (!roles.some((role) => item.roles.includes(role))) return false;
    if (!can(item.module, "view")) return false;
    const key = `${item.path}:${item.labelKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function canAccessNavPath(
  roles: Role[],
  path: string,
  can: (module: Module, permission: Permission) => boolean,
): boolean {
  return NAV_ITEMS.some(
    (entry) =>
      entry.path === path &&
      roles.some((role) => entry.roles.includes(role)) &&
      can(entry.module, "view"),
  );
}

export function getNavLabelKeyForPath(roles: Role[], path: string): string | undefined {
  const item = NAV_ITEMS.find(
    (entry) => entry.path === path && roles.some((role) => entry.roles.includes(role)),
  );
  return item?.labelKey;
}
