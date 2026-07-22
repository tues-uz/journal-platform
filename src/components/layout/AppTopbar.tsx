import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/useAuth";
import { notificationsApi } from "@/lib/api/notifications";
import { ROLE_LABELS } from "@/lib/rbac/types";
import { routes } from "@/app/routes";

export { NAV_ITEMS, type NavItemDef } from "@/lib/rbac/navItems";

interface AppTopbarProps {
  title?: string;
}

export function AppTopbar({ title }: AppTopbarProps) {
  const { user, logout } = useAuth();
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-6 gap-4">
      {title && <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{title}</h1>}
      <div className="flex-1 max-w-md ml-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search submissions, authors..."
            className="pl-9 rounded-xl bg-gray-50 border-gray-200"
          />
        </div>
      </div>
      <Button variant="ghost" size="icon" className="relative rounded-xl" asChild>
        <Link to={routes.notifications}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {unreadCount}
            </Badge>
          )}
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 rounded-xl">
            <UserAvatar
              name={user?.name ?? "User"}
              avatarUrl={user?.avatarUrl}
              className="h-8 w-8"
              fallbackClassName="text-sm"
            />
            <span className="text-sm font-medium hidden md:inline">{user?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.name}</span>
              <span className="text-xs font-normal text-gray-500">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user?.roles.map((role) => (
            <DropdownMenuItem key={role} disabled className="text-xs text-gray-500">
              {ROLE_LABELS[role]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={routes.profile}>Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
