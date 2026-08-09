import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Bell, Check } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { notificationsApi } from "@/lib/api/notifications";
import type { Notification } from "@/lib/store/types";
import { routes } from "@/app/routes";
import { cn } from "@/lib/utils";

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

function NotificationRow({
  notification,
  onMarkRead,
  isMarkingRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}) {
  const content = (
    <>
      <p
        className={cn(
          "text-sm font-medium leading-snug",
          notification.read ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {notification.title}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{notification.message}</p>
      <time className="mt-2 block text-xs text-muted-foreground/80">
        {formatTimestamp(notification.createdAt)}
      </time>
    </>
  );

  return (
    <article
      className={cn(
        "flex gap-4 px-5 py-4 transition-colors",
        !notification.read && "bg-muted/15",
      )}
    >
      <div className="flex w-5 shrink-0 justify-center pt-1.5">
        {!notification.read ? (
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
        ) : (
          <Check className="h-4 w-4 text-muted-foreground/45" strokeWidth={2} aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {notification.link ? (
              <Link
                to={notification.link}
                className="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {content}
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  View details
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
              </Link>
            ) : (
              content
            )}
          </div>

          {!notification.read ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              disabled={isMarkingRead}
              onClick={() => onMarkRead(notification.id)}
            >
              Mark read
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    enabled: !!user,
  });

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <AuthenticatedLayout
      title="Notifications"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
          : "You're all caught up"
      }
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Notifications" }]}
    >
      <div className="mx-auto w-full max-w-4xl pb-8">
        {notifications.length === 0 ? (
          <div className="rounded-lg border border-border/80 bg-card px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/30">
              <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Updates about submissions and editorial work will appear here.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-lg border border-border/80 bg-card">
            <div className="divide-y divide-border/80">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  isMarkingRead={markReadMutation.isPending}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default NotificationsPage;
