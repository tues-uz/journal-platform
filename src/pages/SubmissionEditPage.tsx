import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
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
import { useJournalStore } from "@/lib/store/store";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";
import { buildSubmissionFilesFromUpload, MANUSCRIPT_UPLOAD_ACCEPT, MANUSCRIPT_UPLOAD_HINT } from "@/lib/files/submissionFiles";

const SubmissionEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const submissions = useJournalStore((s) => s.submissions);
  const updateSubmission = useJournalStore((s) => s.updateSubmission);
  const addActivity = useJournalStore((s) => s.addActivity);
  const users = useJournalStore((s) => s.users);
  const { needsPayment } = useAuthorSubmissionAccess();

  const submission = submissions.find((s) => s.id === id);

  const [title, setTitle] = useState(submission?.title ?? "");
  const [abstract, setAbstract] = useState(submission?.abstract ?? "");
  const [keywords, setKeywords] = useState(submission?.keywords.join(", ") ?? "");
  const [language, setLanguage] = useState(submission?.language ?? "English");
  const [articleType, setArticleType] = useState(submission?.articleType ?? "Research Article");
  const [manuscriptFiles, setManuscriptFiles] = useState<UploadedFileMeta[]>([]);

  if (!can("submission", "edit")) {
    return <Navigate to={routes.dashboard} replace />;
  }

  if (!submission || !user || submission.authorId !== user.id || submission.status !== "draft") {
    return <Navigate to={routes.submissions} replace />;
  }

  const saveDraft = async () => {
    const manuscriptSubmissionFiles = manuscriptFiles.length
      ? await buildSubmissionFilesFromUpload(manuscriptFiles, "manuscript", `file-${submission.id}`)
      : [];

    updateSubmission(submission.id, {
      title,
      abstract,
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      language,
      articleType,
      ...(manuscriptSubmissionFiles.length
        ? {
            files: [
              ...submission.files.filter((f) => f.type !== "manuscript"),
              ...manuscriptSubmissionFiles,
            ],
          }
        : {}),
    });
    toast({ title: "Draft saved" });
  };

  const submitManuscript = async () => {
    if (needsPayment) {
      navigate(routes.payment);
      return;
    }

    await saveDraft();
    const now = new Date().toISOString();
    updateSubmission(submission.id, {
      status: "administrative_review",
      plagiarismStatus: "pending",
    });
    addActivity({
      submissionId: submission.id,
      action: "Manuscript Submitted",
      actorId: user.id,
      actorName: user.name,
      actorRoles: user.roles,
      statusAfter: "administrative_review",
      timestamp: now,
    });
    users
      .filter((u) => u.status === "active" && u.roles.includes("editorial_staff"))
      .forEach((staff) => {
        useJournalStore.getState().addNotification({
          userId: staff.id,
          title: "New Submission for Screening",
          message: `${submission.submissionNumber} requires administrative screening.`,
          read: false,
          createdAt: now,
          link: routes.submissionById(submission.id),
        });
      });
    toast({ title: "Manuscript submitted for screening" });
    navigate(routes.submissionById(submission.id));
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
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Abstract</Label>
            <Textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} className="rounded-xl mt-1 min-h-32" />
          </div>
          <div>
            <Label>Keywords (comma-separated)</Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Indonesian">Indonesian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Article Type</Label>
              <Select value={articleType} onValueChange={setArticleType}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Research Article">Research Article</SelectItem>
                  <SelectItem value="Review Article">Review Article</SelectItem>
                  <SelectItem value="Case Study">Case Study</SelectItem>
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
            <Button variant="outline" className="rounded-xl" onClick={() => void saveDraft()}>
              Save Draft
            </Button>
            <Button className="rounded-xl" onClick={() => void submitManuscript()}>
              Submit Manuscript
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
};

export default SubmissionEditPage;
