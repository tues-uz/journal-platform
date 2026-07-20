import { useMemo } from "react";
import { ClipboardCheck } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmissionListTable } from "@/components/shared/SubmissionListTable";
import { useAuth } from "@/features/auth/useAuth";
import { useJournalStore } from "@/lib/store/store";
import { filterSubmissionsForReviews } from "@/lib/store/submissionFilters";
import { routes } from "@/app/routes";

export default function ReviewsPage() {
  const { user } = useAuth();
  const submissions = useJournalStore((s) => s.submissions);
  const getUserById = useJournalStore((s) => s.getUserById);

  const reviews = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForReviews(submissions, user.id, user.roles).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [submissions, user]);

  const pendingCount = reviews.filter((s) => !s.reviewSubmitted).length;

  return (
    <AuthenticatedLayout
      title="Reviews"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Reviews" }]}
    >
      {pendingCount > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-800">
          {pendingCount} review{pendingCount === 1 ? "" : "s"} awaiting your recommendation.
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No reviews assigned"
          description="When a handling editor assigns you a manuscript, it will appear here."
        />
      ) : (
        <SubmissionListTable
          submissions={reviews}
          getUserById={getUserById}
          actionLabel={(sub) => (sub.reviewSubmitted ? "View" : "Review")}
          extraColumns={[
            {
              header: "Review",
              cell: (sub) => (
                <Badge
                  variant={sub.reviewSubmitted ? "secondary" : "default"}
                  className="rounded-lg"
                >
                  {sub.reviewSubmitted ? "Submitted" : "Pending"}
                </Badge>
              ),
            },
          ]}
        />
      )}
    </AuthenticatedLayout>
  );
}
