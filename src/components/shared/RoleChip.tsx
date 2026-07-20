import type { Role } from "@/lib/rbac/types";
import { ROLE_LABELS } from "@/lib/rbac/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ROLE_CHIP_STYLES: Record<Role, string> = {
  author: "bg-slate-100 text-slate-700 border-slate-200",
  editorial_staff: "bg-orange-50 text-orange-700 border-orange-200",
  editor_in_chief: "bg-purple-50 text-purple-700 border-purple-200",
  handling_editor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  reviewer: "bg-blue-50 text-blue-700 border-blue-200",
  copyeditor: "bg-teal-50 text-teal-700 border-teal-200",
  layout_editor: "bg-cyan-50 text-cyan-700 border-cyan-200",
  publisher_admin: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

interface RoleChipProps {
  role: Role;
  className?: string;
}

export function RoleChip({ role, className }: RoleChipProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-lg text-xs font-medium border px-2 py-0",
        ROLE_CHIP_STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </Badge>
  );
}

interface RoleChipListProps {
  roles: Role[];
  className?: string;
}

export function RoleChipList({ roles, className }: RoleChipListProps) {
  if (roles.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {roles.map((role) => (
        <RoleChip key={role} role={role} />
      ))}
    </div>
  );
}
