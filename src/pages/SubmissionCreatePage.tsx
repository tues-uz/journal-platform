import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";
import { MANUSCRIPT_UPLOAD_ACCEPT, MANUSCRIPT_UPLOAD_HINT } from "@/lib/files/submissionFiles";
import { submissionsApi } from "@/lib/api/submissions";
import { uploadSubmissionFiles } from "@/lib/api/files";
import { ApiClientError } from "@/lib/api/client";
import type { SubmissionAuthor } from "@/lib/store/types";

const STEPS = ["Article Information", "Authors", "Files", "Preview & Submit"];

const SubmissionCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const { needsPayment } = useAuthorSubmissionAccess();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [language, setLanguage] = useState("English");
  const [articleType, setArticleType] = useState("Research Article");
  const [orcid, setOrcid] = useState("");
  const [manuscriptFiles, setManuscriptFiles] = useState<UploadedFileMeta[]>([]);
  const [coverFiles, setCoverFiles] = useState<UploadedFileMeta[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<UploadedFileMeta[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const authorInstitution = user?.institution ?? "";

  if (!can("submission", "create")) {
    return <Navigate to={routes.dashboard} replace />;
  }

  if (needsPayment) {
    return <Navigate to={routes.payment} replace />;
  }

  const canNext = () => {
    if (step === 0) return title.trim() && abstract.trim() && keywords.trim();
    if (step === 1) return !!user?.name && !!user?.email;
    if (step === 2) return manuscriptFiles.length > 0;
    return true;
  };

  const createAndUpload = async (saveAsDraft: boolean) => {
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      const authors: SubmissionAuthor[] = [
        {
          name: user.name,
          email: user.email,
          institution: authorInstitution,
          orcid: orcid || undefined,
          isCorresponding: true,
        },
      ];

      const submission = await submissionsApi.create({
        title,
        abstractText: abstract,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        language,
        articleType,
        authors,
        saveAsDraft,
      });

      const manuscript = manuscriptFiles.map((f) => f.file).filter((f): f is File => !!f);
      const cover = coverFiles.map((f) => f.file).filter((f): f is File => !!f);
      const additional = additionalFiles.map((f) => f.file).filter((f): f is File => !!f);

      await Promise.all([
        uploadSubmissionFiles(submission.id, manuscript, "MANUSCRIPT"),
        uploadSubmissionFiles(submission.id, cover, "COVER_LETTER"),
        uploadSubmissionFiles(submission.id, additional, "SUPPORTING"),
      ]);

      if (saveAsDraft) {
        toast({ title: "Draft saved. Submit when ready." });
        navigate(routes.submissionById(submission.id));
      } else {
        toast({ title: "Submission submitted successfully." });
        navigate(routes.submissionById(submission.id));
      }
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Unable to create submission.";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => createAndUpload(true);
  const handleSubmit = () => createAndUpload(false);

  return (
    <AuthenticatedLayout
      title="Create Submission"
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Submissions", href: routes.submissions },
        { label: "New" },
      ]}
    >
      <div className="flex gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center py-2 px-3 rounded-xl text-sm font-medium ${
              i === step
                ? "bg-blue-600 text-white"
                : i < step
                  ? "bg-blue-50 text-blue-700"
                  : "bg-gray-100 text-gray-500"
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <Card className="rounded-xl shadow-sm max-w-3xl">
        <CardContent className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="submission-title">Title</Label>
                <Input id="submission-title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label htmlFor="submission-abstract">Abstract</Label>
                <Textarea id="submission-abstract" value={abstract} onChange={(e) => setAbstract(e.target.value)} className="rounded-xl mt-1 min-h-32" />
              </div>
              <div>
                <Label htmlFor="submission-keywords">Keywords (comma-separated)</Label>
                <Input id="submission-keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="rounded-xl mt-1" />
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
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Name, email, and institution are taken from your account and cannot be changed here.
              </p>
              <div>
                <Label>Author Name</Label>
                <Input
                  value={user?.name ?? ""}
                  readOnly
                  className="rounded-xl mt-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="rounded-xl mt-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Institution</Label>
                <Input
                  value={authorInstitution}
                  readOnly
                  placeholder="Not provided at registration"
                  className="rounded-xl mt-1 bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>ORCID (optional)</Label>
                <Input value={orcid} onChange={(e) => setOrcid(e.target.value)} className="rounded-xl mt-1" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <FileUpload
                label="Upload Manuscript"
                accept={MANUSCRIPT_UPLOAD_ACCEPT}
                hint={MANUSCRIPT_UPLOAD_HINT}
                files={manuscriptFiles}
                onChange={setManuscriptFiles}
                maxFiles={1}
              />
              <FileUpload
                label="Upload Cover Letter (optional)"
                files={coverFiles}
                onChange={setCoverFiles}
                maxFiles={1}
              />
              <FileUpload
                label="Upload Additional File (optional)"
                description="Upload Table, Images and Appendix"
                files={additionalFiles}
                onChange={setAdditionalFiles}
                maxFiles={1}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-gray-600">{abstract}</p>
              <p className="text-sm"><strong>Keywords:</strong> {keywords}</p>
              <p className="text-sm"><strong>Author:</strong> {user?.name} ({user?.email})</p>
              <p className="text-sm">
                <strong>Files:</strong> {manuscriptFiles.length} manuscript, {coverFiles.length} cover
                letter, {additionalFiles.length} additional
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                className="rounded-xl"
                disabled={!canNext()}
                onClick={() => setStep((s) => s + 1)}
              >
                Next
              </Button>
            ) : (
              <>
                <Button variant="outline" className="rounded-xl" disabled={isSaving} onClick={() => void handleSaveDraft()}>
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Button className="rounded-xl" disabled={isSaving} onClick={() => void handleSubmit()}>
                  {isSaving ? "Submitting..." : "Submit"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
};

export default SubmissionCreatePage;
