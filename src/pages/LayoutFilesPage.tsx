import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LayoutAssignedArticlesTable } from "@/components/layout-editor/LayoutAssignedArticlesTable";
import { useAuth } from "@/features/auth/useAuth";
import { submissionsApi } from "@/lib/api/submissions";
import { useJournalStore } from "@/lib/store/store";
import { filterLayoutProductionFiles } from "@/lib/store/submissionFilters";
import { routes } from "@/app/routes";

export default function LayoutFilesPage() {
  const { user } = useAuth();

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  // Volumes/issues aren't wired to the real publication API yet, so this
  // display-only lookup still reads the mock store.
  const volumes = useJournalStore((s) => s.volumes);
  const journalSettings = useJournalStore((s) => s.journalSettings);

  const completed = useMemo(() => {
    if (!user) return [];
    return filterLayoutProductionFiles(submissions, user.roles, user.id).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [submissions, user]);

  return (
    <AuthenticatedLayout
      title="Completed Layouts"
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Completed Layouts" },
      ]}
    >
      {completed.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No completed layouts"
          description="Articles you finished layout work on will appear here after author proof approval."
        />
      ) : (
        <LayoutAssignedArticlesTable
          submissions={completed}
          journalShortName={journalSettings.shortName}
          volumes={volumes}
        />
      )}
    </AuthenticatedLayout>
  );
}
