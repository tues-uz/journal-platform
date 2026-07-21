import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionListTable } from "@/components/shared/SubmissionListTable";
import { useAuth } from "@/features/auth/useAuth";
import { submissionsApi } from "@/lib/api/submissions";
import { buildUserDirectory } from "@/lib/api/userDirectory";
import { routes } from "@/app/routes";

export default function ReviewerAssignmentPage() {
  const { user } = useAuth();

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  const getUserById = useMemo(() => buildUserDirectory(submissions), [submissions]);

  const queue = useMemo(() => {
    if (!user) return [];
    return submissions
      .filter(
        (s) =>
          s.handlingEditorId === user.id &&
          (s.status === "assigned" || s.status === "under_review") &&
          !s.reviewerId,
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [submissions, user]);

  return (
    <AuthenticatedLayout
      title="Reviewer Assignment"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Reviewer Assignment" }]}
    >
      {queue.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No reviewer assignments pending"
          description="Assigned manuscripts needing a reviewer invitation will appear here."
        />
      ) : (
        <SubmissionListTable submissions={queue} getUserById={getUserById} actionLabel="Assign" />
      )}
    </AuthenticatedLayout>
  );
}
