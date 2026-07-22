import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { notificationsApi } from "@/lib/api/notifications";
import { routes } from "@/app/routes";

const NotificationsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <AuthenticatedLayout
      title="Notifications"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Notifications" }]}
    >
      {notifications.length === 0 ? (
        <p className="text-sm text-gray-500">No notifications.</p>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {notifications.map((n) => (
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
                    disabled={markReadMutation.isPending}
                    onClick={() => markReadMutation.mutate(n.id)}
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
