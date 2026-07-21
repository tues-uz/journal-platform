import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { submissionsApi } from "@/lib/api/submissions";
import { workflowApi } from "@/lib/api/workflow";
import { ApiClientError } from "@/lib/api/client";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";

export default function DoiManagementPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [doiValue, setDoiValue] = useState("");

  const candidates = useMemo(
    () =>
      submissions
        .filter((s) => s.status === "published" || s.status === "production" || s.status === "accepted")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [submissions],
  );

  const assignDoiMutation = useMutation({
    mutationFn: ({ id, doi }: { id: string; doi: string }) => workflowApi.assignDoi(id, doi),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast({ title: "DOI assigned" });
      setEditingId(null);
      setDoiValue("");
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Failed to assign DOI. Please try again.";
      toast({ title: "DOI assignment failed", description: message, variant: "destructive" });
    },
  });

  const startEdit = (id: string, current?: string) => {
    setEditingId(id);
    setDoiValue(current ?? "");
  };

  const saveDoi = (id: string) => {
    if (!user || !can("doi_management", "edit")) return;
    if (!doiValue.trim()) {
      toast({ title: "DOI required", variant: "destructive" });
      return;
    }
    assignDoiMutation.mutate({ id, doi: doiValue.trim() });
  };

  return (
    <AuthenticatedLayout
      title="DOI Management"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "DOI Management" }]}
    >
      {candidates.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No articles for DOI assignment"
          description="Accepted or published articles will appear here for DOI registration."
        />
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submission</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>DOI</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((sub) => {
                const isEditing = editingId === sub.id;
                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <p className="font-medium">{sub.submissionNumber}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{sub.title}</p>
                    </TableCell>
                    <TableCell>{sub.authorName ?? "—"}</TableCell>
                    <TableCell className="capitalize">{sub.status.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={doiValue}
                          onChange={(e) => setDoiValue(e.target.value)}
                          placeholder="10.1234/sjms.2026.001"
                          className="rounded-lg font-mono text-sm"
                        />
                      ) : (
                        <span className="font-mono text-sm">{sub.doi ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            className="rounded-lg"
                            disabled={assignDoiMutation.isPending}
                            onClick={() => saveDoi(sub.id)}
                          >
                            {assignDoiMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            disabled={assignDoiMutation.isPending}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => startEdit(sub.id, sub.doi)}
                        >
                          {sub.doi ? "Edit DOI" : "Assign DOI"}
                        </Button>
                      )}
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
}
