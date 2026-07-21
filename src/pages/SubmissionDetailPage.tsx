import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SubmissionPositionSummary } from "@/components/shared/SubmissionPositionChip";
import { DecisionFeedbackDisplay } from "@/components/shared/DecisionFeedbackDisplay";
import { SubmissionWorkflowActions } from "@/components/shared/SubmissionWorkflowActions";
import { useAuth } from "@/features/auth/useAuth";
import { canViewSubmission } from "@/lib/rbac/submissionAccess";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { routes } from "@/app/routes";
import { getVisibleSubmissionFiles } from "@/lib/files/submissionFiles";
import { submissionsApi } from "@/lib/api/submissions";
import { getFileDownloadUrl } from "@/lib/api/files";
import { useToast } from "@/hooks/use-toast";

const SubmissionDetailPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => submissionsApi.get(id as string),
    enabled: !!id && !!user,
  });

  const getUserById = () => undefined;

  const scope = submission && user ? {
    handlingEditorId: submission.handlingEditorId,
    submissionAuthorId: submission.authorId,
    reviewerId: submission.reviewerId,
    pendingReviewerId: submission.pendingReviewerId,
    currentUserId: user.id,
    isAssignedReviewer: submission.reviewerId === user.id,
  } : undefined;

  usePermissions(scope);

  const visibleFiles = useMemo(() => {
    if (!submission || !user) return [];
    const isAuthorDuringProof =
      submission.authorId === user.id && !!submission.proofReady;
    return getVisibleSubmissionFiles(
      submission.files,
      user.roles,
      submission.authorId === user.id,
      isAuthorDuringProof,
    );
  }, [submission, user]);

  if (isLoading) {
    return (
      <AuthenticatedLayout title="Loading...">
        <p className="text-gray-500">Loading submission...</p>
      </AuthenticatedLayout>
    );
  }

  if (!submission) {
    return (
      <AuthenticatedLayout title="Submission Not Found">
        <p className="text-gray-500">This submission does not exist.</p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link to={routes.dashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </AuthenticatedLayout>
    );
  }

  if (user && !canViewSubmission(submission, user.roles, user.id)) {
    const fallback = user.roles.includes("layout_editor")
      ? routes.production
      : routes.dashboard;
    return <Navigate to={fallback} replace />;
  }

  return (
    <AuthenticatedLayout
      title={submission.title}
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Submissions", href: routes.submissions },
        { label: submission.submissionNumber },
      ]}
    >
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <StatusBadge status={submission.status} />
        <span className="text-sm text-gray-500">{submission.submissionNumber}</span>
      </div>
      <SubmissionPositionSummary
        submission={submission}
        getUserById={getUserById}
        className="mb-4"
      />

      <SubmissionWorkflowActions submission={submission} />

      <DecisionFeedbackDisplay submission={submission} />

      <Tabs defaultValue="metadata" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="authors">Authors</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Article Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Abstract</p>
                <p className="text-sm text-gray-900 mt-1">{submission.abstract}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Article Type</p>
                  <p className="text-sm font-medium">{submission.articleType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Language</p>
                  <p className="text-sm font-medium">{submission.language}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Author</p>
                  <p className="text-sm font-medium">{submission.authorName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Handling Editor</p>
                  <p className="text-sm font-medium">{submission.handlingEditorId ? "Assigned" : "Not assigned"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Keywords</p>
                <p className="text-sm font-medium">{submission.keywords.join(", ")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authors">
          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              {submission.authors.map((a, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-gray-500">{a.email}</p>
                  <p className="text-sm text-gray-500">{a.institution}</p>
                  {a.isCorresponding && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-2 inline-block">
                      Corresponding Author
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-6">
              {visibleFiles.length === 0 ? (
                <p className="text-sm text-gray-500">No files uploaded.</p>
              ) : (
                <ul className="space-y-2">
                  {visibleFiles.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 capitalize">{f.type.replace(/_/g, " ")}</p>
                        <p className="text-sm font-medium truncate">{f.name}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 flex-shrink-0"
                        title={`Download ${f.name}`}
                        onClick={async () => {
                          try {
                            const url = await getFileDownloadUrl(submission.id, f.id);
                            window.open(url, "_blank", "noopener,noreferrer");
                          } catch {
                            toast({
                              title: "Download unavailable",
                              description: "Could not get a download link for this file.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">
                Detailed activity history isn't exposed by the API yet — the backend records every
                action internally, but there's no endpoint to read it back.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AuthenticatedLayout>
  );
};

export default SubmissionDetailPage;
