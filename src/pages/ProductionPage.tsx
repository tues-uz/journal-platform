import { useMemo } from "react";
import { Factory } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionListTable } from "@/components/shared/SubmissionListTable";
import { LayoutAssignedArticlesTable } from "@/components/layout-editor/LayoutAssignedArticlesTable";
import { LayoutStatusBadge } from "@/components/shared/LayoutStatusBadge";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useJournalStore } from "@/lib/store/store";
import { filterSubmissionsForProduction } from "@/lib/store/submissionFilters";
import { getStatusLabel } from "@/lib/status/config";
import { routes } from "@/app/routes";

export default function ProductionPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const submissions = useJournalStore((s) => s.submissions);
  const volumes = useJournalStore((s) => s.volumes);
  const journalSettings = useJournalStore((s) => s.journalSettings);
  const getUserById = useJournalStore((s) => s.getUserById);
  const assignLayoutEditor = useJournalStore((s) => s.assignLayoutEditor);
  const users = useJournalStore((s) => s.users);

  const isLayoutEditor =
    can("layout_production", "view") && !can("copyediting", "view");
  const isPublisher = user?.roles.includes("publisher_admin") ?? false;

  const pageTitle = isPublisher
    ? "Production Pipeline"
    : can("copyediting", "view") && !can("layout_production", "view")
      ? "Copyediting Queue"
      : isLayoutEditor
        ? "Assigned Articles"
        : "Production";

  const pipeline = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForProduction(submissions, user.roles, user.id).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [submissions, user]);

  const layoutEditors = users.filter(
    (u) => u.status === "active" && u.roles.includes("layout_editor"),
  );

  const copyeditingCount = pipeline.filter((s) => s.status === "copyediting").length;
  const productionCount = pipeline.filter((s) => s.status === "production").length;

  return (
    <AuthenticatedLayout
      title={pageTitle}
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: pageTitle }]}
    >
      {pipeline.length > 0 && !isLayoutEditor && (
        <div className="mb-4 flex flex-wrap gap-3">
          <Badge variant="secondary" className="rounded-lg px-3 py-1">
            {copyeditingCount} in copyediting
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
          title={isLayoutEditor ? "No assigned articles" : "No production tasks"}
          description={
            isLayoutEditor
              ? "Articles assigned to you for layout will appear here."
              : "Accepted manuscripts entering copyediting or layout will appear here."
          }
        />
      ) : isLayoutEditor ? (
        <LayoutAssignedArticlesTable
          submissions={pipeline}
          journalShortName={journalSettings.shortName}
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
                    header: "Layout Editor",
                    cell: (sub: (typeof pipeline)[0]) => {
                      if (sub.status !== "production") return "—";
                      return (
                        <select
                          className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                          value={sub.layoutEditorId ?? ""}
                          onChange={(e) => {
                            if (!user || !e.target.value) return;
                            assignLayoutEditor(sub.id, e.target.value, user.id, user.name);
                          }}
                        >
                          <option value="">Unassigned</option>
                          {layoutEditors.map((editor) => (
                            <option key={editor.id} value={editor.id}>
                              {editor.name}
                            </option>
                          ))}
                        </select>
                      );
                    },
                  },
                ]
              : []),
          ]}
        />
      )}
    </AuthenticatedLayout>
  );
}
