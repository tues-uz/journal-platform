import { useMemo } from "react";
import { canAnyRole, canViewModule } from "@/lib/rbac/can";
import type { Module, Permission, ScopeContext } from "@/lib/rbac/types";
import { useAuth } from "@/features/auth/useAuth";

export function usePermissions(context?: ScopeContext) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  return useMemo(
    () => ({
      roles,
      can: (module: Module, permission: Permission) =>
        canAnyRole(roles, module, permission, {
          ...context,
          currentUserId: user?.id,
        }),
      viewableModules: canViewModule(roles),
      isAdmin: roles.includes("publisher_admin"),
    }),
    [roles, context, user?.id],
  );
}
