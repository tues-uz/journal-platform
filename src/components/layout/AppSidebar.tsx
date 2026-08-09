import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, LogOut, Menu, Bell, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useSidebarLayout } from "@/features/layout/useSidebarLayout";
import { getVisibleNavItems, type NavItemDef } from "@/lib/rbac/navItems";
import { ROLE_LABELS } from "@/lib/rbac/types";
import { routes } from "@/app/routes";

const ACCOUNT_PATHS = new Set([
  routes.notifications,
  routes.profile,
  routes.settings,
  routes.payment,
  routes.payments,
]);

function groupNavItems(items: NavItemDef[]) {
  const overview = items.filter((item) => item.path === routes.dashboard);
  const account = items.filter((item) => ACCOUNT_PATHS.has(item.path));
  const workflow = items.filter(
    (item) => item.path !== routes.dashboard && !ACCOUNT_PATHS.has(item.path),
  );
  return { overview, workflow, account };
}

function getPrimaryRoleLabel(roles: string[]) {
  const primary = roles[0];
  return primary ? ROLE_LABELS[primary as keyof typeof ROLE_LABELS] : "Member";
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { isCollapsed, toggleCollapsed } = useSidebarLayout();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleItems = getVisibleNavItems(user?.roles ?? [], can);
  const sections = useMemo(() => groupNavItems(visibleItems), [visibleItems]);

  const isActive = (path: string) => {
    if (path === routes.dashboard) return location.pathname === routes.dashboard;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate(routes.signin);
  };

  const renderNavLink = (item: NavItemDef) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link
        key={`${item.path}:${item.labelKey}`}
        to={item.path}
        onClick={() => setIsMobileOpen(false)}
        title={isCollapsed ? t(item.labelKey) : undefined}
        className={`flex w-full items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm outline-none transition-colors h-8 ${
          active
            ? "bg-teal-50 font-medium text-teal-800"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        } ${isCollapsed ? "justify-center px-0" : ""}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
      </Link>
    );
  };

  const renderSection = (labelKey: string, items: NavItemDef[]) => {
    if (items.length === 0) return null;
    return (
      <div className="relative flex w-full min-w-0 flex-col px-0 py-1">
        {!isCollapsed && (
          <div className="flex h-7 shrink-0 items-center px-2 text-xs font-medium text-muted-foreground">
            {t(labelKey)}
          </div>
        )}
        <div className="flex w-full flex-col gap-0.5">{items.map(renderNavLink)}</div>
      </div>
    );
  };

  const sidebarWidth = isCollapsed ? "w-20" : "w-64";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background shadow-sm lg:hidden">
        <div className="mx-auto flex h-14 items-center justify-between px-4">
          <Link
            to={routes.dashboard}
            className="flex items-center gap-2"
            onClick={() => setIsMobileOpen(false)}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">SJMS</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              asChild
            >
              <Link to={routes.notifications} aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-[60] h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ${sidebarWidth} ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:z-30`}
      >
        <div className="flex h-full flex-col">
          <div className="relative flex min-h-14 items-center px-2 py-2">
            <Link
              to={routes.dashboard}
              className={`flex min-h-0 flex-1 items-center gap-2 px-2 ${isCollapsed ? "justify-center px-0" : ""}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
                <BookOpen className="h-4 w-4" />
              </span>
              {!isCollapsed && (
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">SJMS</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {getPrimaryRoleLabel(user?.roles ?? [])} Dashboard
                  </span>
                </div>
              )}
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-1">
            <div className="flex flex-col gap-1">
              {renderSection("nav.sections.overview", sections.overview)}
              {renderSection("nav.sections.workflow", sections.workflow)}
              {renderSection("nav.sections.account", sections.account)}
            </div>
          </nav>

          <div className="px-2 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-3">
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className="mb-2 hidden h-8 w-full justify-start gap-2 rounded-md px-2 text-sm font-normal text-sidebar-foreground/80 hover:bg-sidebar-accent lg:inline-flex"
                aria-label="Collapse sidebar"
              >
                <PanelLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Collapse</span>
              </Button>
            )}
            {isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className="mb-2 hidden h-8 w-full justify-center rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent lg:inline-flex"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={`h-8 w-full gap-2 rounded-md px-2 text-sm font-normal text-sidebar-foreground/80 hover:bg-rose-50 hover:text-rose-700 ${
                isCollapsed ? "justify-center px-0" : "justify-start"
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{t("common.logout")}</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
