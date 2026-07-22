import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Library, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { volumesApi, type ManagedVolume } from "@/lib/api/volumes";
import { issuesApi, type ManagedIssue } from "@/lib/api/issues";
import { submissionsApi } from "@/lib/api/submissions";
import { ApiClientError } from "@/lib/api/client";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";

export default function VolumesPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: volumes = [] } = useQuery({
    queryKey: ["volumes"],
    queryFn: () => volumesApi.list(),
    enabled: !!user,
  });
  const { data: issues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => issuesApi.list(),
    enabled: !!user,
  });
  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
    enabled: !!user,
  });

  const [volNumber, setVolNumber] = useState("");
  const [volYear, setVolYear] = useState(String(new Date().getFullYear()));
  const [volTitle, setVolTitle] = useState("");
  const [issueVolumeId, setIssueVolumeId] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [issueTitle, setIssueTitle] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["volumes"] });
    void queryClient.invalidateQueries({ queryKey: ["issues"] });
  };

  const createVolumeMutation = useMutation({
    mutationFn: volumesApi.create,
    onSuccess: () => {
      invalidate();
      toast({ title: "Volume created" });
      setVolNumber("");
      setVolTitle("");
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Failed to create volume.";
      toast({ title: "Create failed", description: message, variant: "destructive" });
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: issuesApi.create,
    onSuccess: () => {
      invalidate();
      toast({ title: "Issue created" });
      setIssueNumber("");
      setIssueTitle("");
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Failed to create issue.";
      toast({ title: "Create failed", description: message, variant: "destructive" });
    },
  });

  const publishIssueMutation = useMutation({
    mutationFn: (issueId: string) => issuesApi.publish(issueId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Issue published" });
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Failed to publish issue.";
      toast({ title: "Publish failed", description: message, variant: "destructive" });
    },
  });

  const handleAddVolume = () => {
    if (!can("volume_issue", "create") || !volNumber.trim() || !volYear.trim()) return;
    createVolumeMutation.mutate({
      number: Number(volNumber),
      year: Number(volYear),
      title: volTitle.trim() || undefined,
    });
  };

  const handleAddIssue = () => {
    if (!can("volume_issue", "create") || !issueVolumeId || !issueNumber.trim()) return;
    createIssueMutation.mutate({
      volumeId: issueVolumeId,
      number: Number(issueNumber),
      title: issueTitle.trim() || undefined,
    });
  };

  const issuesByVolume = useMemo(() => {
    const map = new Map<string, ManagedIssue[]>();
    for (const issue of issues) {
      const list = map.get(issue.volumeId) ?? [];
      list.push(issue);
      map.set(issue.volumeId, list);
    }
    return map;
  }, [issues]);

  const submissionsByIssue = useMemo(() => {
    const map = new Map<string, typeof submissions>();
    for (const sub of submissions) {
      if (!sub.issueId) continue;
      const list = map.get(sub.issueId) ?? [];
      list.push(sub);
      map.set(sub.issueId, list);
    }
    return map;
  }, [submissions]);

  const renderVolume = (volume: ManagedVolume) => {
    const volumeIssues = issuesByVolume.get(volume.id) ?? [];
    return (
      <Card key={volume.id} className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">
              {volume.title ?? `Volume ${volume.number}`} ({volume.year})
            </CardTitle>
            <Badge variant={volume.status === "published" ? "default" : "secondary"} className="rounded-lg">
              {volume.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {volumeIssues.length === 0 ? (
            <p className="text-sm text-gray-500">No issues yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volumeIssues.map((issue) => {
                  const assigned = submissionsByIssue.get(issue.id) ?? [];
                  return (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium">Issue {issue.number}</TableCell>
                      <TableCell>{issue.title ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={issue.status === "published" ? "default" : "secondary"} className="rounded-lg">
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assigned.length === 0 ? (
                          <span className="text-sm text-gray-500">
                            No articles assigned yet — assign a volume/issue when publishing an article.
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {assigned.map((sub) => (
                              <div key={sub.id} className="text-sm">
                                <Link to={routes.submissionById(sub.id)} className="text-blue-600 hover:underline">
                                  {sub.submissionNumber}
                                </Link>
                                {sub.authorName && <span className="text-gray-500"> — {sub.authorName}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {can("publication", "publish") && issue.status !== "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            disabled={publishIssueMutation.isPending}
                            onClick={() => publishIssueMutation.mutate(issue.id)}
                          >
                            Publish Issue
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AuthenticatedLayout
      title="Issues"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Issues" }]}
    >
      {can("volume_issue", "create") && (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Create Volume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Number</Label>
                  <Input value={volNumber} onChange={(e) => setVolNumber(e.target.value)} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input value={volYear} onChange={(e) => setVolYear(e.target.value)} className="rounded-xl mt-1" />
                </div>
              </div>
              <div>
                <Label>Title (optional)</Label>
                <Input value={volTitle} onChange={(e) => setVolTitle(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <Button className="rounded-xl" onClick={handleAddVolume} disabled={createVolumeMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {createVolumeMutation.isPending ? "Adding..." : "Add Volume"}
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Create Issue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Volume</Label>
                <select
                  className="w-full mt-1 rounded-xl border px-3 py-2 text-sm"
                  value={issueVolumeId}
                  onChange={(e) => setIssueVolumeId(e.target.value)}
                >
                  <option value="">Select volume</option>
                  {volumes.map((v) => (
                    <option key={v.id} value={v.id}>
                      Volume {v.number} ({v.year})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Issue number</Label>
                <Input value={issueNumber} onChange={(e) => setIssueNumber(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Title (optional)</Label>
                <Input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <Button
                className="rounded-xl"
                onClick={handleAddIssue}
                disabled={!issueVolumeId || createIssueMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createIssueMutation.isPending ? "Adding..." : "Add Issue"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {volumes.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No volumes yet"
          description="Create a volume and issue to assign accepted articles for publication."
        />
      ) : (
        <div className="space-y-6">{volumes.map(renderVolume)}</div>
      )}
    </AuthenticatedLayout>
  );
}
