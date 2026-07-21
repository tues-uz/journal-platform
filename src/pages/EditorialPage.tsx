import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PenTool } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionListTable } from "@/components/shared/SubmissionListTable";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { submissionsApi } from "@/lib/api/submissions";
import { filterSubmissionsForEditorial } from "@/lib/store/submissionFilters";
import { routes } from "@/app/routes";

export default function EditorialPage() {
  const { user } = useAuth();
  const { can } = usePermissions();

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  // No general id→name directory endpoint yet — see SubmissionsPage.
  const getUserById = () => undefined;

  const queue = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForEditorial(submissions, user.id, user.roles).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [submissions, user]);

  const screeningCount = queue.filter(
    (s) => s.status === "submitted" || s.status === "administrative_review",
  ).length;

  const needsScreening = (status: string) =>
    status === "submitted" || status === "administrative_review";

  return (
    <AuthenticatedLayout
      title="Editorial"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Editorial" }]}
    >
      {can("admin_screening", "decide") && screeningCount > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-800">
          {screeningCount} submission{screeningCount === 1 ? "" : "s"} in the editorial screening
          queue.
        </div>
      )}

      {queue.length === 0 ? (
        <EmptyState
          icon={PenTool}
          title="No editorial tasks"
          description="Submissions awaiting screening, assignment, or editorial decisions will appear here."
        />
      ) : (
        <SubmissionListTable
          submissions={queue}
          getUserById={getUserById}
          actionLabel={(sub) =>
            can("admin_screening", "decide") && needsScreening(sub.status) ? "Screen" : "Open"
          }
        />
      )}
    </AuthenticatedLayout>
  );
}
