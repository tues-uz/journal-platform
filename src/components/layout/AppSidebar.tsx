import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, LogOut, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useSidebarLayout } from "@/features/layout/useSidebarLayout";
import { getVisibleNavItems } from "@/lib/rbac/navItems";
import { ROLE_LABELS } from "@/lib/rbac/types";
import { routes } from "@/app/routes";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { isCollapsed, toggleCollapsed } = useSidebarLayout();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = getVisibleNavItems(user?.roles ?? [], can);

  const isActive = (path: string) => {
    if (path === routes.dashboard) return location.pathname === routes.dashboard;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate(routes.signin);
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white rounded-xl"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-56"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 relative">
            <Link
              to={routes.dashboard}
              className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-lg font-semibold text-gray-900">SJMS</span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="hidden lg:flex h-8 w-8 rounded-full absolute top-4 -right-4 border border-gray-200 bg-white z-10"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {!isCollapsed && user && (
            <div className="px-4 pb-4">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {user.roles.map((r) => ROLE_LABELS[r]).join(", ")}
              </p>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-3">
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${active ? "text-white" : "text-gray-500"}`}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{t(item.labelKey)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-3">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{t("common.logout")}</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
