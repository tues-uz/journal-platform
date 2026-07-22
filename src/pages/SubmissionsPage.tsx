import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SubmissionPositionChip } from "@/components/shared/SubmissionPositionChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useAuthorSubmissionAccess } from "@/lib/payment/useAuthorSubmissionAccess";
import { submissionsApi } from "@/lib/api/submissions";
import { buildUserDirectory } from "@/lib/api/userDirectory";
import { ALL_STATUSES } from "@/lib/status/config";
import { routes } from "@/app/routes";

const SubmissionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { canCreateSubmission, needsPayment } = useAuthorSubmissionAccess();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  const getUserById = useMemo(() => buildUserDirectory(submissions), [submissions]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = [...submissions];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.submissionNumber.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }

    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [submissions, search, statusFilter]);

  const pendingScreeningCount = useMemo(() => {
    if (!can("admin_screening", "decide")) return 0;
    return submissions.filter(
      (s) => s.status === "submitted" || s.status === "administrative_review",
    ).length;
  }, [submissions, can]);

  const needsScreening = (status: string) =>
    status === "submitted" || status === "administrative_review";

  return (
    <AuthenticatedLayout
      title="Submissions"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Submissions" }]}
      toolbar={
        canCreateSubmission ? (
          <Button asChild className="rounded-xl">
            <Link to={routes.submissionCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Submission
            </Link>
          </Button>
        ) : undefined
      }
    >
      {needsPayment && (
        <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
          Submission requires a one-time fee.{" "}
          <Link to={routes.payment} className="font-medium underline underline-offset-2">
            Complete payment to unlock
          </Link>
          .
        </div>
      )}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Search by title or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-xl"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pendingScreeningCount > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-800">
          {pendingScreeningCount} submission{pendingScreeningCount === 1 ? "" : "s"} awaiting your
          administrative screening. Open a submission and use the action panel at the top.
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-sm text-gray-500">
          Loading submissions...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No submissions found"
          description="Create your first submission to get started."
          actionLabel={canCreateSubmission ? "Create Submission" : needsPayment ? "Complete Payment" : undefined}
          onAction={
            canCreateSubmission
              ? () => navigate(routes.submissionCreate)
              : needsPayment
                ? () => navigate(routes.payment)
                : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Position</TableHead>
                <TableHead>Editor</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => {
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-sm">{sub.submissionNumber}</TableCell>
                    <TableCell className="max-w-xs truncate font-medium">{sub.title}</TableCell>
                    <TableCell>{sub.authorName ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell>
                      <SubmissionPositionChip
                        submission={sub}
                        getUserById={getUserById}
                        showLabel={false}
                      />
                    </TableCell>
                    <TableCell>{sub.handlingEditorName ?? (sub.handlingEditorId ? "Assigned" : "—")}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(sub.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={can("admin_screening", "decide") && needsScreening(sub.status) ? "default" : "outline"}
                        size="sm"
                        asChild
                        className="rounded-lg"
                      >
                        <Link to={routes.submissionById(sub.id)}>
                          {can("admin_screening", "decide") && needsScreening(sub.status)
                            ? "Screen"
                            : "View"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AuthenticatedLayout>
  );
};

export default SubmissionsPage;
