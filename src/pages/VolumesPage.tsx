import { useMemo, useState } from "react";
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
import { useJournalStore } from "@/lib/store/store";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";

export default function VolumesPage() {
  const { can } = usePermissions();
  const { toast } = useToast();
  const volumes = useJournalStore((s) => s.volumes);
  const submissions = useJournalStore((s) => s.submissions);
  const getUserById = useJournalStore((s) => s.getUserById);
  const addVolume = useJournalStore((s) => s.addVolume);
  const addIssue = useJournalStore((s) => s.addIssue);
  const updateIssue = useJournalStore((s) => s.updateIssue);
  const updateSubmission = useJournalStore((s) => s.updateSubmission);

  const [volNumber, setVolNumber] = useState("");
  const [volYear, setVolYear] = useState(String(new Date().getFullYear()));
  const [volTitle, setVolTitle] = useState("");
  const [issueVolumeId, setIssueVolumeId] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [issueTitle, setIssueTitle] = useState("");

  const publishable = useMemo(
    () => submissions.filter((s) => s.status === "published" || s.status === "production"),
    [submissions],
  );

  const getSubmissionTitle = (id: string) =>
    submissions.find((s) => s.id === id)?.submissionNumber ?? id;

  const handleAddVolume = () => {
    if (!can("volume_issue", "create") || !volNumber.trim() || !volYear.trim()) return;
    addVolume({
      number: Number(volNumber),
      year: Number(volYear),
      title: volTitle.trim() || undefined,
      status: "draft",
    });
    toast({ title: "Volume created" });
    setVolNumber("");
    setVolTitle("");
  };

  const handleAddIssue = () => {
    if (!can("volume_issue", "create") || !issueVolumeId || !issueNumber.trim()) return;
    const created = addIssue(issueVolumeId, {
      number: Number(issueNumber),
      title: issueTitle.trim() || undefined,
      status: "draft",
      articleIds: [],
    });
    if (created) {
      toast({ title: "Issue created" });
      setIssueNumber("");
      setIssueTitle("");
    }
  };

  const assignArticle = (volumeId: string, issueId: string, submissionId: string) => {
    if (!can("volume_issue", "assign")) return;
    const volume = volumes.find((v) => v.id === volumeId);
    const issue = volume?.issues.find((i) => i.id === issueId);
    if (!issue || issue.articleIds.includes(submissionId)) return;
    updateIssue(volumeId, issueId, { articleIds: [...issue.articleIds, submissionId] });
    updateSubmission(submissionId, { volumeId, issueId });
    toast({ title: "Article assigned to issue" });
  };

  const publishIssue = (volumeId: string, issueId: string) => {
    if (!can("volume_issue", "edit")) return;
    updateIssue(volumeId, issueId, {
      status: "published",
      publishedAt: new Date().toISOString(),
    });
    toast({ title: "Issue published" });
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
              <Button className="rounded-xl" onClick={handleAddVolume}>
                <Plus className="h-4 w-4 mr-2" />
                Add Volume
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
              <Button className="rounded-xl" onClick={handleAddIssue} disabled={!issueVolumeId}>
                <Plus className="h-4 w-4 mr-2" />
                Add Issue
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
        <div className="space-y-6">
          {volumes.map((volume) => (
            <Card key={volume.id} className="rounded-xl shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg">
                    {volume.title ?? `Volume ${volume.number}`} ({volume.year})
                  </CardTitle>
                  <Badge
                    variant={volume.status === "published" ? "default" : "secondary"}
                    className="rounded-lg"
                  >
                    {volume.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
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
                    {volume.issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">Issue {issue.number}</TableCell>
                        <TableCell>{issue.title ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={issue.status === "published" ? "default" : "secondary"}
                            className="rounded-lg"
                          >
                            {issue.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {issue.articleIds.length === 0 ? (
                            <span className="text-sm text-gray-500">No articles assigned</span>
                          ) : (
                            <div className="space-y-1">
                              {issue.articleIds.map((articleId) => {
                                const sub = submissions.find((s) => s.id === articleId);
                                const author = sub ? getUserById(sub.authorId) : undefined;
                                return (
                                  <div key={articleId} className="text-sm">
                                    <Link
                                      to={routes.submissionById(articleId)}
                                      className="text-blue-600 hover:underline"
                                    >
                                      {getSubmissionTitle(articleId)}
                                    </Link>
                                    {author && (
                                      <span className="text-gray-500"> — {author.name}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {can("volume_issue", "assign") && publishable.length > 0 && (
                            <select
                              className="mt-2 w-full rounded-lg border px-2 py-1 text-xs"
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignArticle(volume.id, issue.id, e.target.value);
                                  e.target.value = "";
                                }
                              }}
                            >
                              <option value="">Assign article…</option>
                              {publishable
                                .filter((s) => !issue.articleIds.includes(s.id))
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.submissionNumber} — {s.title.slice(0, 40)}
                                  </option>
                                ))}
                            </select>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {can("volume_issue", "edit") && issue.status !== "published" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg"
                              onClick={() => publishIssue(volume.id, issue.id)}
                            >
                              Publish Issue
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AuthenticatedLayout>
  );
}
