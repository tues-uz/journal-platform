import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionListTable } from "@/components/shared/SubmissionListTable";
import { useJournalStore } from "@/lib/store/store";
import { filterSubmissionsForPlagiarism } from "@/lib/store/submissionFilters";
import { routes } from "@/app/routes";

export default function PlagiarismPage() {
  const submissions = useJournalStore((s) => s.submissions);
  const getUserById = useJournalStore((s) => s.getUserById);

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
