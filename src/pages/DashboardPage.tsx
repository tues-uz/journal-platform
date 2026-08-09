import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LayoutStatusBadge } from "@/components/shared/LayoutStatusBadge";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useAuthorSubmissionAccess } from "@/lib/payment/useAuthorSubmissionAccess";
import { submissionsApi } from "@/lib/api/submissions";
import { notificationsApi } from "@/lib/api/notifications";
import { routes } from "@/app/routes";
import { getLayoutStats, filterSubmissionsForProduction, filterSubmissionsForUser } from "@/lib/store/submissionFilters";

const DashboardPage = () => {
  const { user } = useAuth();
  const { can, roles } = usePermissions();
  const { canCreateSubmission, needsPayment } = useAuthorSubmissionAccess();

  const isHandlingEditorOnly =
    roles.includes("handling_editor") &&
    !roles.includes("editor_in_chief") &&
    !roles.includes("publisher_admin");

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions", user?.id],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => notificationsApi.list(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const relevantSubmissions = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForUser(submissions, user.id, user.roles);
  }, [submissions, user]);

  const newAssignments = useMemo(
    () =>
      relevantSubmissions
        .filter((submission) => submission.status === "assigned")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [relevantSubmissions],
  );

  const assignmentNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.read &&
          (notification.title.includes("Handling Editor") ||
            notification.link?.includes("/dashboard/submissions/")),
      ),
    [notifications],
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications],
  );

  const pendingReviews = relevantSubmissions.filter((s) => s.status === "under_review").length;
  const pendingDecisions = relevantSubmissions.filter(
    (s) => s.status === "revision_required" || s.status === "eic_approval_pending",
  ).length;
  const paymentDueSubmissions = useMemo(
    () =>
      roles.includes("author")
        ? relevantSubmissions.filter((s) => s.status === "payment_pending")
        : [],
    [relevantSubmissions, roles],
  );

  const isProductionEditor =
    roles.includes("production_editor") && !roles.includes("publisher_admin");
  const layoutStats = useMemo(
    () => (user && isProductionEditor ? getLayoutStats(submissions, user.id) : null),
    [submissions, user, isProductionEditor],
  );

  const layoutQueue = useMemo(() => {
    if (!user || !isProductionEditor) return [];
    return filterSubmissionsForProduction(submissions, user.roles, user.id);
  }, [submissions, user, isProductionEditor]);

  const stats = isProductionEditor && layoutStats
    ? [
        { label: "Assigned", value: layoutStats.assigned, href: routes.production },
        { label: "In progress", value: layoutStats.inProgress, href: routes.production },
        { label: "Proofreading", value: layoutStats.waitingForProofreading, href: routes.production },
        { label: "Completed", value: layoutStats.completed, href: routes.layoutFiles },
      ]
    : [
        {
          label: isHandlingEditorOnly ? "Assigned" : "Submissions",
          value: relevantSubmissions.length,
          href: can("submission", "view") ? routes.submissions : routes.dashboard,
        },
        { label: "In review", value: pendingReviews, href: routes.reviews },
        {
          label: isHandlingEditorOnly ? "To pre-screen" : "Decisions",
          value: isHandlingEditorOnly ? newAssignments.length : pendingDecisions,
          href: routes.submissions,
        },
        { label: "Unread", value: unreadNotifications.length, href: routes.notifications },
      ];

  const recentSubmissions = isProductionEditor
    ? [...layoutQueue]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6)
    : [...relevantSubmissions]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6);

  const listTitle = isProductionEditor
    ? "Assigned work"
    : isHandlingEditorOnly
      ? "Your manuscripts"
      : "Recent submissions";
  const listHref = isProductionEditor ? routes.production : routes.submissions;
  const firstName = user?.name?.split(/\s+/)[0] ?? "there";

  return (
    <AuthenticatedLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
              Hello, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s what needs your attention today.
            </p>
          </div>
          {canCreateSubmission && (
            <Button asChild variant="outline" className="h-9 shrink-0 rounded-lg px-4 text-sm">
              <Link to={needsPayment ? routes.payment : routes.submissionCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                {needsPayment ? "Unlock submission" : "New submission"}
              </Link>
            </Button>
          )}
        </div>

        {paymentDueSubmissions.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Publication payment due</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {paymentDueSubmissions.length === 1
                  ? `${paymentDueSubmissions[0]!.submissionNumber} was approved — pay the APC to start layout.`
                  : `${paymentDueSubmissions.length} manuscripts need publication payment.`}
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0 rounded-lg">
              <Link to={routes.payment}>Pay now</Link>
            </Button>
          </div>
        )}

        {needsPayment && (
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
            Payment is required before you can submit a new manuscript.{" "}
            <Link to={routes.payment} className="font-medium underline underline-offset-2">
              Complete payment
            </Link>
          </p>
        )}

        <section aria-label="Summary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                to={stat.href}
                className="group rounded-lg border border-border/80 bg-card px-4 py-3 transition-colors hover:border-border hover:bg-muted/30"
              >
                <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground group-hover:text-foreground/70">
                  {stat.label}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {isHandlingEditorOnly && newAssignments.length > 0 ? (
          <section aria-label="New assignments">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-foreground">
                New assignments ({newAssignments.length})
              </h2>
              <Link
                to={routes.submissions}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="divide-y divide-border/80 rounded-lg border border-sky-200/80 bg-sky-50/40">
              {newAssignments.slice(0, 4).map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={routes.submissionById(sub.id)}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-sky-50/80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{sub.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {sub.submissionNumber} · Ready for pre-screening
                      </p>
                    </div>
                    <StatusBadge status={sub.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {isHandlingEditorOnly && assignmentNotifications.length > 0 ? (
          <section aria-label="Recent invites">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-foreground">Recent invites</h2>
              <Link
                to={routes.notifications}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                All notifications
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="divide-y divide-border/80 rounded-lg border border-border/80 bg-card">
              {assignmentNotifications.slice(0, 3).map((notification) => (
                <li key={notification.id}>
                  {notification.link ? (
                    <Link
                      to={notification.link}
                      className="block px-4 py-3.5 transition-colors hover:bg-muted/20"
                    >
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{notification.message}</p>
                    </Link>
                  ) : (
                    <div className="px-4 py-3.5">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{notification.message}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-label={listTitle}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-foreground">{listTitle}</h2>
            {can("submission", "view") && recentSubmissions.length > 0 && (
              <Link
                to={listHref}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {isProductionEditor
                  ? "No assigned articles yet."
                  : isHandlingEditorOnly
                    ? "No manuscripts assigned to you yet. New invites from the editor-in-chief will appear here."
                    : "No submissions yet."}
              </p>
              {canCreateSubmission && !needsPayment && (
                <Button asChild variant="link" className="mt-2 h-auto p-0 text-sm">
                  <Link to={routes.submissionCreate}>Create your first submission</Link>
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border/80 rounded-lg border border-border/80 bg-card">
              {recentSubmissions.map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={routes.submissionById(sub.id)}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{sub.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{sub.submissionNumber}</p>
                    </div>
                    {isProductionEditor ? (
                      <LayoutStatusBadge submission={sub} />
                    ) : (
                      <StatusBadge status={sub.status} />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AuthenticatedLayout>
  );
};

export default DashboardPage;
