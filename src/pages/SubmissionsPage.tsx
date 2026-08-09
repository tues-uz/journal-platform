import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, Search } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RoleChip } from "@/components/shared/RoleChip";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useAuthorSubmissionAccess } from "@/lib/payment/useAuthorSubmissionAccess";
import { submissionsApi } from "@/lib/api/submissions";
import { buildUserDirectory } from "@/lib/api/userDirectory";
import { filterSubmissionsForUser } from "@/lib/store/submissionFilters";
import { getSubmissionAssignee } from "@/lib/workflow/submissionActions";
import { routes } from "@/app/routes";
import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/store/types";

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const QUICK_STATUS_FILTERS: Array<{ value: "all" | SubmissionStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "assigned", label: "Assigned" },
  { value: "under_review", label: "In review" },
  { value: "revision_required", label: "Revision" },
  { value: "payment_pending", label: "Payment" },
  { value: "production", label: "Production" },
  { value: "published", label: "Published" },
];

function pageSubtitle(roles: string[], total: number) {
  if (roles.includes("author")) return `${total} manuscript${total === 1 ? "" : "s"} you submitted`;
  if (roles.includes("handling_editor") && !roles.includes("editor_in_chief")) {
    return `${total} manuscript${total === 1 ? "" : "s"} assigned to you`;
  }
  if (roles.includes("editor_in_chief")) return `${total} manuscript${total === 1 ? "" : "s"} in the journal`;
  return `${total} manuscript${total === 1 ? "" : "s"}`;
}

const SubmissionsPage = () => {
  const { user } = useAuth();
  const { can, roles } = usePermissions();
  const { canCreateSubmission, needsPayment } = useAuthorSubmissionAccess();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions", user?.id],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const getUserById = useMemo(() => buildUserDirectory(submissions), [submissions]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");

  const visibleSubmissions = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForUser(submissions, user.id, user.roles);
  }, [submissions, user]);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<SubmissionStatus | "all", number>> = { all: visibleSubmissions.length };
    for (const submission of visibleSubmissions) {
      counts[submission.status] = (counts[submission.status] ?? 0) + 1;
    }
    return counts;
  }, [visibleSubmissions]);

  const filtered = useMemo(() => {
    let list = [...visibleSubmissions];

    if (search) {
      const query = search.toLowerCase();
      list = list.filter(
        (submission) =>
          submission.title.toLowerCase().includes(query) ||
          submission.submissionNumber.toLowerCase().includes(query) ||
          (submission.authorName?.toLowerCase().includes(query) ?? false),
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((submission) => submission.status === statusFilter);
    }

    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [visibleSubmissions, search, statusFilter]);

  const awaitingAssignmentCount = useMemo(
    () => visibleSubmissions.filter((submission) => submission.status === "submitted").length,
    [visibleSubmissions],
  );

  const isEic = roles.includes("editor_in_chief");

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Submissions" },
      ]}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
              Submissions
            </h1>
            <p className="text-sm text-muted-foreground">
              {pageSubtitle(user?.roles ?? [], visibleSubmissions.length)}
              {filtered.length !== visibleSubmissions.length
                ? ` · ${filtered.length} shown`
                : null}
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

        {needsPayment && (
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
            Payment is required before you can submit a new manuscript.{" "}
            <Link to={routes.payment} className="font-medium underline underline-offset-2">
              Complete payment
            </Link>
          </p>
        )}

        {isEic && awaitingAssignmentCount > 0 && (
          <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 px-4 py-3 text-sm text-sky-950">
            {awaitingAssignmentCount} submission{awaitingAssignmentCount === 1 ? "" : "s"} awaiting
            handling editor assignment.
          </div>
        )}

        <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              placeholder="Search title, ID, or author…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-lg border-border/80 bg-background pl-9"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {QUICK_STATUS_FILTERS.map((option) => {
              const count =
                option.value === "all"
                  ? statusCounts.all ?? 0
                  : statusCounts[option.value] ?? 0;
              if (option.value !== "all" && count === 0) return null;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === option.value
                      ? "bg-foreground text-background"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {option.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      statusFilter === option.value
                        ? "bg-background/20 text-background"
                        : "bg-background text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-border/80 px-4 py-16 text-center text-sm text-muted-foreground">
            Loading submissions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 px-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">No submissions match your filters.</p>
            {canCreateSubmission && (
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-sm">
                <Link to={needsPayment ? routes.payment : routes.submissionCreate}>
                  {needsPayment ? "Complete payment" : "Create a submission"}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((submission) => {
              const assignee = getSubmissionAssignee(submission, getUserById);

              return (
                <li key={submission.id}>
                  <Link
                    to={routes.submissionById(submission.id)}
                    className="group block rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-border hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-sans text-base font-semibold leading-snug text-foreground">
                          {submission.title}
                        </h2>

                        <p className="mt-1.5 text-xs text-muted-foreground">
                          <span className="font-mono text-[11px]">{submission.submissionNumber}</span>
                          <span className="mx-1.5 text-border">·</span>
                          {submission.authorName ?? "Unknown author"}
                          <span className="mx-1.5 text-border">·</span>
                          Updated {formatUpdatedAt(submission.updatedAt)}
                        </p>
                      </div>

                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                      <StatusBadge status={submission.status} />
                      {assignee ? (
                        <>
                          <span className="text-xs text-muted-foreground">{assignee.prefix}</span>
                          {assignee.roles[0] ? <RoleChip role={assignee.roles[0]} /> : null}
                          <span className="truncate text-xs font-medium text-foreground">
                            {assignee.name}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default SubmissionsPage;
