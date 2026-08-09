import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav, type BreadcrumbItemDef } from "@/components/layout/BreadcrumbNav";
import { useAuth } from "@/features/auth/useAuth";
import { useSidebarLayout } from "@/features/layout/useSidebarLayout";
import { notificationsApi } from "@/lib/api/notifications";
import { ROLE_LABELS } from "@/lib/rbac/types";
import { routes } from "@/app/routes";

export { NAV_ITEMS, type NavItemDef } from "@/lib/rbac/navItems";

interface AppTopbarProps {
  breadcrumbs?: BreadcrumbItemDef[];
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppTopbar({ breadcrumbs }: AppTopbarProps) {
  const { user } = useAuth();
  const { toggleCollapsed } = useSidebarLayout();
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.read).length;
  const primaryRole = user?.roles[0];
  const roleLabel = primaryRole ? ROLE_LABELS[primaryRole] : "Member";

  return (
    <header className="z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="-ml-1 hidden size-7 hover:bg-muted hover:text-foreground lg:inline-flex"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        {breadcrumbs && breadcrumbs.length > 0 && <BreadcrumbNav items={breadcrumbs} />}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
          asChild
        >
          <Link to={routes.notifications} aria-label="Notifications" title="Notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        <div className="hidden min-w-0 flex-col items-end gap-0.5 md:flex">
          <div className="flex max-w-[16rem] items-center gap-1.5">
            <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold leading-none text-foreground">
              {roleLabel}
            </span>
            <p className="truncate text-xs font-medium text-foreground">{user?.name}</p>
          </div>
          <p className="max-w-[16rem] truncate text-[11px] text-muted-foreground">{user?.email}</p>
        </div>

        <div
          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-500 to-emerald-600"
          aria-hidden="true"
        >
          <span className="text-xs font-semibold text-white">
            {getInitials(user?.name ?? "U") || "U"}
          </span>
        </div>
      </div>
    </header>
  );
}
