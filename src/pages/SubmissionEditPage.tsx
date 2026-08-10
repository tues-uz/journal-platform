import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type UploadedFileMeta } from "@/components/shared/FileUpload";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useAuthorSubmissionAccess } from "@/lib/payment/useAuthorSubmissionAccess";
import { submissionsApi } from "@/lib/api/submissions";
import { uploadSubmissionFiles } from "@/lib/api/files";
import { ApiClientError } from "@/lib/api/client";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";
import { MANUSCRIPT_UPLOAD_ACCEPT, MANUSCRIPT_UPLOAD_HINT } from "@/lib/files/submissionFiles";

const SubmissionEditPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { needsPayment } = useAuthorSubmissionAccess();

  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => submissionsApi.get(id),
    enabled: !!id && !!user,
  });

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [language, setLanguage] = useState("English");
  const [articleType, setArticleType] = useState("Original Manuscript");
  const [manuscriptFiles, setManuscriptFiles] = useState<UploadedFileMeta[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (submission) {
      setTitle(submission.title ?? "");
      setAbstract(submission.abstract ?? "");
      setKeywords(submission.keywords?.join(", ") ?? "");
      setLanguage(submission.language ?? "English");
      setArticleType(submission.articleType ?? "Original Manuscript");
    }
  }, [submission]);

  const updateMutation = useMutation({
    mutationFn: (vars: { submit: boolean }) =>
      submissionsApi.update(id, {
        title: title.trim(),
        abstractText: abstract.trim(),
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        language,
        articleType,
        submit: vars.submit,
      }),
    onSuccess: async (_data, vars) => {
      const filesToUpload = manuscriptFiles.map((f) => f.file).filter((f): f is File => !!f);
      if (filesToUpload.length > 0) {
        await uploadSubmissionFiles(id, filesToUpload, "MANUSCRIPT");
      }
      void queryClient.invalidateQueries({ queryKey: ["submission", id] });
      void queryClient.invalidateQueries({ queryKey: ["submissions"] });
      void queryClient.invalidateQueries({ queryKey: ["submission-activities", id] });
      toast({
        title: vars.submit ? "Manuscript submitted" : "Draft saved",
      });
      navigate(routes.submissionById(id));
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Failed to update submission.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  if (!can("submission", "edit")) {
    return <Navigate to={routes.dashboard} replace />;
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout title="Edit Draft">
        <p className="text-sm text-muted-foreground">Loading draft…</p>
      </AuthenticatedLayout>
    );
  }

  if (!submission || !user || submission.authorId !== user.id || submission.status !== "draft") {
    return <Navigate to={routes.submissions} replace />;
  }

  const handleSaveDraft = () => {
    setIsSubmitting(true);
    updateMutation.mutate({ submit: false });
  };

  const handleSubmitManuscript = () => {
    if (needsPayment) {
      navigate(routes.payment);
      return;
    }
    setIsSubmitting(true);
    updateMutation.mutate({ submit: true });
  };

  return (
    <AuthenticatedLayout
      title="Edit Draft"
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Submissions", href: routes.submissions },
        { label: submission.submissionNumber },
      ]}
    >
      <Card className="rounded-xl shadow-sm max-w-3xl">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="draft-title">Title</Label>
            <Input
              id="draft-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl mt-1"
            />
          </div>
          <div>
            <Label htmlFor="draft-abstract">Abstract</Label>
            <Textarea
              id="draft-abstract"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className="rounded-xl mt-1 min-h-32"
            />
          </div>
          <div>
            <Label htmlFor="draft-keywords">Keywords (comma-separated)</Label>
            <Input
              id="draft-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="rounded-xl mt-1"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Indonesian">Indonesian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Article Type</Label>
              <Select value={articleType} onValueChange={setArticleType}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Original Manuscript">Original Manuscript</SelectItem>
                  <SelectItem value="Invited Manuscript">Invited Manuscript</SelectItem>
                  <SelectItem value="Book Review">Book Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <FileUpload
            label="Replace Manuscript (optional)"
            accept={MANUSCRIPT_UPLOAD_ACCEPT}
            hint={MANUSCRIPT_UPLOAD_HINT}
            files={manuscriptFiles}
            onChange={setManuscriptFiles}
            maxFiles={1}
          />
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={isSubmitting}
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
            <Button
              className="rounded-xl"
              disabled={isSubmitting}
              onClick={handleSubmitManuscript}
            >
              Submit Manuscript
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
};

export default SubmissionEditPage;
