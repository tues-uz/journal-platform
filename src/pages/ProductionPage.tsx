import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Factory } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionListTable } from "@/components/shared/SubmissionListTable";
import { LayoutAssignedArticlesTable } from "@/components/layout-editor/LayoutAssignedArticlesTable";
import { LayoutStatusBadge } from "@/components/shared/LayoutStatusBadge";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { submissionsApi } from "@/lib/api/submissions";
import { volumesApi } from "@/lib/api/volumes";
import { issuesApi } from "@/lib/api/issues";
import { publicSettingsApi } from "@/lib/api/publicSettings";
import { buildUserDirectory } from "@/lib/api/userDirectory";
import { filterSubmissionsForProduction } from "@/lib/store/submissionFilters";
import { getStatusLabel } from "@/lib/status/config";
import type { Volume } from "@/lib/store/types";
import { routes } from "@/app/routes";

export default function ProductionPage() {
  const { user } = useAuth();
  const { can } = usePermissions();

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
  const getUserById = useMemo(() => buildUserDirectory(submissions), [submissions]);

  const isHandlingEditor =
    can("layout_production", "view") && user?.roles.includes("handling_editor");
  const isPublisher = user?.roles.includes("publisher_admin") ?? false;

  const pageTitle = isPublisher
    ? "Production Pipeline"
    : isHandlingEditor
      ? "Production Queue"
      : "Production";

  const pipeline = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForProduction(submissions, user.roles, user.id).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [submissions, user]);

  const productionCount = pipeline.filter((s) => s.status === "production").length;
  const acceptedCount = pipeline.filter((s) => s.status === "accepted").length;

  return (
    <AuthenticatedLayout
      title={pageTitle}
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: pageTitle }]}
    >
      {pipeline.length > 0 && !isHandlingEditor && (
        <div className="mb-4 flex flex-wrap gap-3">
          <Badge variant="secondary" className="rounded-lg px-3 py-1">
            {acceptedCount} accepted, awaiting production
          </Badge>
          <Badge variant="secondary" className="rounded-lg px-3 py-1">
            {productionCount} in layout/production
          </Badge>
          <Badge variant="secondary" className="rounded-lg px-3 py-1">
            {pipeline.filter((s) => s.proofReady && !s.proofApproved).length} awaiting author proof
          </Badge>
          <Badge variant="secondary" className="rounded-lg px-3 py-1">
            {pipeline.filter((s) => s.proofApproved).length} ready to publish
          </Badge>
        </div>
      )}

      {pipeline.length === 0 ? (
        <EmptyState
          icon={Factory}
          title={isHandlingEditor ? "No assigned articles" : "No production tasks"}
          description={
            isHandlingEditor
              ? "Manuscripts cleared for layout after payment will appear here."
              : "Accepted manuscripts entering production will appear here."
          }
        />
      ) : isHandlingEditor ? (
        <LayoutAssignedArticlesTable
          submissions={pipeline}
          journalShortName={journalShortName}
          volumes={volumes}
        />
      ) : (
        <SubmissionListTable
          submissions={pipeline}
          getUserById={getUserById}
          actionLabel="Work on"
          extraColumns={[
            {
              header: "Stage",
              cell: (sub) =>
                sub.status === "production" && sub.layoutEditorId ? (
                  <LayoutStatusBadge submission={sub} />
                ) : (
                  <span className="text-sm text-gray-700">
                    {sub.proofApproved
                      ? "Ready to publish"
                      : sub.proofReady
                        ? "Author proofreading"
                        : getStatusLabel(sub.status)}
                  </span>
                ),
            },
            ...(isPublisher
              ? [
                  {
                    header: "Production Editor",
                    cell: (sub: (typeof pipeline)[0]) =>
                      sub.status !== "production" && sub.status !== "accepted"
                        ? "—"
                        : (sub.layoutEditorName ?? "Unclaimed"),
                  },
                ]
              : []),
          ]}
        />
      )}
    </AuthenticatedLayout>
  );
}
