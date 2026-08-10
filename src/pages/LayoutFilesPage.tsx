import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LayoutAssignedArticlesTable } from "@/components/layout-editor/LayoutAssignedArticlesTable";
import { useAuth } from "@/features/auth/useAuth";
import { submissionsApi } from "@/lib/api/submissions";
import { volumesApi } from "@/lib/api/volumes";
import { issuesApi } from "@/lib/api/issues";
import { publicSettingsApi } from "@/lib/api/publicSettings";
import { filterLayoutProductionFiles } from "@/lib/store/submissionFilters";
import type { Volume } from "@/lib/store/types";
import { routes } from "@/app/routes";

export default function LayoutFilesPage() {
  const { user } = useAuth();

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  const { data: managedVolumes = [] } = useQuery({
    queryKey: ["volumes"],
    queryFn: () => volumesApi.list(),
    enabled: !!user,
  });

  const { data: managedIssues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => issuesApi.list(),
    enabled: !!user,
  });

  const { data: publicSettings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => publicSettingsApi.get(),
    enabled: !!user,
  });

  const volumes: Volume[] = useMemo(() => {
    return managedVolumes.map((vol) => ({
      id: vol.id,
      number: vol.number,
      year: vol.year,
      title: vol.title,
      status: vol.status,
      issues: managedIssues
        .filter((issue) => issue.volumeId === vol.id)
        .map((issue) => ({
          id: issue.id,
          volumeId: vol.id,
          number: issue.number,
          title: issue.title,
          status: issue.status,
          articleIds: [],
        })),
    }));
  }, [managedVolumes, managedIssues]);

  const journalShortName = publicSettings?.shortName ?? "SJMS";

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
          journalShortName={journalShortName}
          volumes={volumes}
        />
      )}
    </AuthenticatedLayout>
  );
}
