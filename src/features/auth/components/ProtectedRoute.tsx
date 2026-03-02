import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { routes } from "@/app/routes";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={routes.signin} replace />;
  }

  return <Outlet />;
}
