import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gavel } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionListTable } from "@/components/shared/SubmissionListTable";
import { useAuth } from "@/features/auth/useAuth";
import { submissionsApi } from "@/lib/api/submissions";
import { buildUserDirectory } from "@/lib/api/userDirectory";
import { filterSubmissionsForEditorial } from "@/lib/store/submissionFilters";
import { routes } from "@/app/routes";

export default function EditorialDecisionPage() {
  const { user } = useAuth();

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  const getUserById = useMemo(() => buildUserDirectory(submissions), [submissions]);

  const queue = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForEditorial(submissions, user.id, user.roles).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [submissions, user]);

  return (
    <AuthenticatedLayout
      title="Editorial Decision"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Editorial Decision" }]}
    >
      {queue.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No decisions pending"
          description="Submissions awaiting editor assignment or final editorial decision will appear here."
        />
      ) : (
        <SubmissionListTable
          submissions={queue}
          getUserById={getUserById}
          actionLabel={(sub) => (sub.status === "assigned" ? "Assign Editor" : "Decide")}
        />
      )}
    </AuthenticatedLayout>
  );
}
