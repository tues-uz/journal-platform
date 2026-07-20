import { useMemo } from "react";
import { BookOpenCheck } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionListTable } from "@/components/shared/SubmissionListTable";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useJournalStore } from "@/lib/store/store";
import {
  filterPublishedSubmissions,
  filterSubmissionsReadyToPublish,
} from "@/lib/store/submissionFilters";
import { routes } from "@/app/routes";

export default function PublishedPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const submissions = useJournalStore((s) => s.submissions);
  const volumes = useJournalStore((s) => s.volumes);
  const getUserById = useJournalStore((s) => s.getUserById);

  const isAdmin = can("publication", "publish");

  const readyToPublish = useMemo(() => {
    if (!user || !isAdmin) return [];
    return filterSubmissionsReadyToPublish(submissions, user.roles).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [submissions, user, isAdmin]);

  const published = useMemo(() => {
    if (!user) return [];
    return filterPublishedSubmissions(submissions, user.id, user.roles).sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.updatedAt).getTime() -
        new Date(a.publishedAt ?? a.updatedAt).getTime(),
    );
  }, [submissions, user]);

  const getVolumeIssueLabel = (volumeId?: string, issueId?: string) => {
    if (!volumeId || !issueId) return "—";
    const volume = volumes.find((v) => v.id === volumeId);
    const issue = volume?.issues.find((i) => i.id === issueId);
    if (!volume || !issue) return "—";
    return `Vol. ${volume.number}, Issue ${issue.number}`;
  };

  const hasContent = readyToPublish.length > 0 || published.length > 0;

  return (
    <AuthenticatedLayout
      title="Publication"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Publication" }]}
    >
      {!hasContent ? (
        <EmptyState
          icon={BookOpenCheck}
          title="No publication activity"
          description={
            isAdmin
              ? "Articles ready to publish or already published will appear here after author proof approval."
              : "Your published articles will appear here once they are released in a volume and issue."
          }
        />
      ) : (
        <div className="space-y-8">
          {isAdmin && readyToPublish.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Ready to Publish</h2>
              <p className="text-sm text-gray-500 mb-4">
                These manuscripts passed author proofreading and can be published now.
              </p>
              <SubmissionListTable
                submissions={readyToPublish}
                getUserById={getUserById}
                actionLabel="Publish"
                hideEditor
              />
            </section>
          )}

          {published.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Published Articles</h2>
              <SubmissionListTable
                submissions={published}
                getUserById={getUserById}
                actionLabel="View"
                hideEditor
                extraColumns={[
                  {
                    header: "DOI",
                    cell: (sub) => (
                      <span className="font-mono text-xs text-gray-600">{sub.doi ?? "—"}</span>
                    ),
                  },
                  {
                    header: "Volume / Issue",
                    cell: (sub) => (
                      <span className="text-sm text-gray-700">
                        {getVolumeIssueLabel(sub.volumeId, sub.issueId)}
                      </span>
                    ),
                  },
                  {
                    header: "Published",
                    cell: (sub) => (
                      <span className="text-sm text-gray-500">
                        {sub.publishedAt
                          ? new Date(sub.publishedAt).toLocaleDateString()
                          : new Date(sub.updatedAt).toLocaleDateString()}
                      </span>
                    ),
                  },
                ]}
              />
            </section>
          )}
        </div>
      )}
    </AuthenticatedLayout>
  );
}
