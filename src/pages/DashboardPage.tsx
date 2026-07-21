import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Bell,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LayoutStatusBadge } from "@/components/shared/LayoutStatusBadge";
import { SubmissionPositionChip } from "@/components/shared/SubmissionPositionChip";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useAuthorSubmissionAccess } from "@/lib/payment/useAuthorSubmissionAccess";
import { submissionsApi } from "@/lib/api/submissions";
import { buildUserDirectory } from "@/lib/api/userDirectory";
import { useJournalStore } from "@/lib/store/store";
import { routes } from "@/app/routes";
import { canAccessNavPath } from "@/lib/rbac/navItems";
import { getLayoutStats, filterSubmissionsForProduction } from "@/lib/store/submissionFilters";
import type { Submission } from "@/lib/store/types";

function filterSubmissionsForUser(
  submissions: Submission[],
  userId: string,
  roles: string[],
): Submission[] {
  if (roles.includes("publisher_admin") || roles.includes("editor_in_chief")) {
    return submissions;
  }
  if (roles.includes("editorial_staff")) {
    return submissions.filter(
      (s) => s.status === "submitted" || s.status === "administrative_review",
    );
  }
  if (roles.includes("handling_editor")) {
    return submissions.filter((s) => s.handlingEditorId === userId);
  }
  if (roles.includes("reviewer")) {
    return submissions.filter((s) => s.status === "under_review");
  }
  if (roles.includes("copyeditor")) {
    return submissions.filter((s) => s.status === "copyediting");
  }
  if (roles.includes("layout_editor")) {
    return submissions.filter(
      (s) =>
        s.status === "production" &&
        (s.layoutEditorId === userId || !s.layoutEditorId),
    );
  }
  if (roles.includes("author")) {
    return submissions.filter((s) => s.authorId === userId);
  }
  return [];
}

const DashboardPage = () => {
  const { user } = useAuth();
  const { can, roles } = usePermissions();
  const { canCreateSubmission, needsPayment } = useAuthorSubmissionAccess();

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  // Real GET /api/notifications exists but isn't wired yet — separate follow-up.
  const notifications = useJournalStore((s) => s.notifications);
  const getUserById = useMemo(() => buildUserDirectory(submissions), [submissions]);

  const relevantSubmissions = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForUser(submissions, user.id, user.roles);
  }, [submissions, user]);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => n.userId === user?.id && !n.read),
    [notifications, user?.id],
  );

  const pendingReviews = relevantSubmissions.filter((s) => s.status === "under_review").length;
  const pendingDecisions = relevantSubmissions.filter(
    (s) => s.status === "revision_required" || s.status === "administrative_review",
  ).length;

  const isLayoutEditor = roles.includes("layout_editor") && !roles.includes("publisher_admin");
  const layoutStats = useMemo(
    () => (user && isLayoutEditor ? getLayoutStats(submissions, user.id) : null),
    [submissions, user, isLayoutEditor],
  );

  const layoutQueue = useMemo(() => {
    if (!user || !isLayoutEditor) return [];
    return filterSubmissionsForProduction(submissions, user.roles, user.id);
  }, [submissions, user, isLayoutEditor]);

  const stats = isLayoutEditor && layoutStats
    ? [
        {
          label: "Assigned Articles",
          value: layoutStats.assigned,
          icon: FileText,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "In Progress",
          value: layoutStats.inProgress,
          icon: Clock,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        },
        {
          label: "Waiting for Proofreading",
          value: layoutStats.waitingForProofreading,
          icon: AlertCircle,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          label: "Completed",
          value: layoutStats.completed,
          icon: CheckCircle2,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
      ]
    : [
    {
      label: "My Submissions",
      value: relevantSubmissions.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Reviews",
      value: pendingReviews,
      icon: Clock,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Pending Decisions",
      value: pendingDecisions,
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Notifications",
      value: unreadNotifications.length,
      icon: Bell,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  const recentSubmissions = isLayoutEditor
    ? [...layoutQueue]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
    : [...relevantSubmissions]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

  return (
    <AuthenticatedLayout
      title="Dashboard"
      breadcrumbs={[{ label: "Dashboard" }]}
      toolbar={
        canCreateSubmission ? (
          <Button asChild className="rounded-xl">
            <Link to={routes.submissionCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Submission
            </Link>
          </Button>
        ) : undefined
      }
    >
      {needsPayment && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
          Submission requires a one-time fee.{" "}
          <Link to={routes.payment} className="font-medium underline underline-offset-2">
            Complete payment to unlock
          </Link>
          .
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {isLayoutEditor ? "Assigned Articles" : "Recent Submissions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-gray-500">
                {isLayoutEditor ? "No assigned articles." : "No submissions to show."}
              </p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => (
                  <Link
                    key={sub.id}
                    to={routes.submissionById(sub.id)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{sub.title}</p>
                      <p className="text-xs text-gray-500">{sub.submissionNumber}</p>
                      {!isLayoutEditor && (
                        <SubmissionPositionChip
                          submission={sub}
                          getUserById={getUserById}
                          showLabel={false}
                          className="mt-1.5"
                        />
                      )}
                    </div>
                    {isLayoutEditor ? (
                      <LayoutStatusBadge submission={sub} />
                    ) : (
                      <StatusBadge status={sub.status} />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Latest Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {unreadNotifications.length === 0 ? (
              <p className="text-sm text-gray-500">No new notifications.</p>
            ) : (
              <div className="space-y-3">
                {unreadNotifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-blue-50/50">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {canCreateSubmission && (
            <Button variant="outline" asChild className="rounded-xl">
              <Link to={routes.submissionCreate}>Create Submission</Link>
            </Button>
          )}
          {needsPayment && (
            <Button variant="outline" asChild className="rounded-xl">
              <Link to={routes.payment}>Complete Payment</Link>
            </Button>
          )}
          {can("submission", "view") && (
            <Button variant="outline" asChild className="rounded-xl">
              <Link to={routes.submissions}>View Submissions</Link>
            </Button>
          )}
          {canAccessNavPath(roles, routes.reviews, can) && (
            <Button variant="outline" asChild className="rounded-xl">
              <Link to={routes.reviews}>My Reviews</Link>
            </Button>
          )}
          {canAccessNavPath(roles, routes.production, can) && isLayoutEditor && (
            <Button variant="outline" asChild className="rounded-xl">
              <Link to={routes.production}>Assigned Articles</Link>
            </Button>
          )}
          {canAccessNavPath(roles, routes.users, can) && (
            <Button variant="outline" asChild className="rounded-xl">
              <Link to={routes.users}>Manage Users</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
};

export default DashboardPage;
