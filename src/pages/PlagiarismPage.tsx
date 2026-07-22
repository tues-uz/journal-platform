import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionListTable } from "@/components/shared/SubmissionListTable";
import { useAuth } from "@/features/auth/useAuth";
import { submissionsApi } from "@/lib/api/submissions";
import { buildUserDirectory } from "@/lib/api/userDirectory";
import { filterSubmissionsForPlagiarism } from "@/lib/store/submissionFilters";
import { routes } from "@/app/routes";

export default function PlagiarismPage() {
  const { user } = useAuth();

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  const getUserById = useMemo(() => buildUserDirectory(submissions), [submissions]);

  const queue = useMemo(
    () =>
      filterSubmissionsForPlagiarism(submissions).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [submissions],
  );

  return (
    <AuthenticatedLayout
      title="Plagiarism Check"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Plagiarism" }]}
    >
      {queue.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No plagiarism checks pending"
          description="Submissions awaiting similarity review will appear here."
        />
      ) : (
        <SubmissionListTable submissions={queue} getUserById={getUserById} actionLabel="Check" />
      )}
    </AuthenticatedLayout>
  );
}
