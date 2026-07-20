import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useJournalStore } from "@/lib/store/store";
import { ROLE_LABELS } from "@/lib/rbac/types";
import { routes } from "@/app/routes";
import { Badge } from "@/components/ui/badge";

const NotificationsPage = () => {
  const { user } = useAuth();
  const notifications = useJournalStore((s) => s.notifications);
  const markNotificationRead = useJournalStore((s) => s.markNotificationRead);

  const userNotifications = notifications.filter((n) => n.userId === user?.id);

  return (
    <AuthenticatedLayout
      title="Notifications"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Notifications" }]}
    >
      {userNotifications.length === 0 ? (
        <p className="text-sm text-gray-500">No notifications.</p>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {userNotifications.map((n) => (
            <Card
              key={n.id}
              className={`rounded-xl shadow-sm ${!n.read ? "border-blue-200 bg-blue-50/30" : ""}`}
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg flex-shrink-0"
                    onClick={() => markNotificationRead(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AuthenticatedLayout>
  );
};

export default NotificationsPage;
