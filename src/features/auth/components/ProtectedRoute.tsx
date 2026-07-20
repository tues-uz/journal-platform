import { Navigate, Outlet } from "react-router-dom";
import type { Module } from "@/lib/rbac/types";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { routes } from "@/app/routes";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";

interface ProtectedRouteProps {
  module?: Module;
  modules?: Module[];
}

export function ProtectedRoute({ module, modules }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const { can } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to={routes.signin} replace />;
  }

  const allowedModules = modules ?? (module ? [module] : []);
  if (allowedModules.length > 0 && !allowedModules.some((entry) => can(entry, "view"))) {
    return <Navigate to={routes.dashboard} replace />;
  }

  return <Outlet />;
}

export function ProtectedLayoutRoute({ module, modules }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const { can } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to={routes.signin} replace />;
  }

  const allowedModules = modules ?? (module ? [module] : []);
  if (allowedModules.length > 0 && !allowedModules.some((entry) => can(entry, "view"))) {
    return <Navigate to={routes.dashboard} replace />;
  }

  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
}
