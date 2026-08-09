import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { SubmissionFilesStep } from "@/components/shared/SubmissionFilesStep";
import { SubmissionReviewStep } from "@/components/shared/SubmissionReviewStep";
import type { UploadedFileMeta } from "@/components/shared/FileUpload";
import { KeywordSuggestInput } from "@/components/shared/KeywordSuggestInput";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { useAuthorSubmissionAccess } from "@/lib/payment/useAuthorSubmissionAccess";
import { routes } from "@/app/routes";
import { useToast } from "@/hooks/use-toast";
import {
  createEmptySubmissionUploadFiles,
  hasRequiredSubmissionUploads,
  OPTIONAL_SUBMISSION_UPLOAD_SLOTS,
  REQUIRED_SUBMISSION_UPLOAD_SLOTS,
  SUBMISSION_UPLOAD_SLOTS,
  type SubmissionUploadSlotId,
} from "@/lib/files/submissionUploadSlots";
import { submissionsApi } from "@/lib/api/submissions";
import { getJournalKeywordVocabulary } from "@/lib/journal/keywords";
import { uploadSubmissionFiles } from "@/lib/api/files";
import { ApiClientError } from "@/lib/api/client";
import { cn, capitalizeFirstLetter } from "@/lib/utils";
import type { SubmissionAuthor } from "@/lib/store/types";

const STEPS = ["Article", "Authors", "Files", "Review"];
const DEFAULT_LANGUAGE = "English";

function filesFromUpload(meta: UploadedFileMeta[]): File[] {
  return meta.map((item) => item.file).filter((file): file is File => !!file);
}

const SubmissionCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const { needsPayment } = useAuthorSubmissionAccess();

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
  });

  const keywordSuggestions = useMemo(
    () => getJournalKeywordVocabulary(submissions),
    [submissions],
  );

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [articleType, setArticleType] = useState("Original Manuscript");
  const [orcid, setOrcid] = useState("");
  const [uploadFiles, setUploadFiles] = useState(createEmptySubmissionUploadFiles);
  const [isSaving, setIsSaving] = useState(false);

  const setUploadSlot = (slotId: SubmissionUploadSlotId, files: UploadedFileMeta[]) => {
    setUploadFiles((current) => ({ ...current, [slotId]: files }));
  };

  const authorInstitution = user?.institution ?? "";

  if (!can("submission", "create")) {
    return <Navigate to={routes.dashboard} replace />;
  }

  if (needsPayment) {
    return <Navigate to={routes.payment} replace />;
  }

  const canNext = () => {
    if (step === 0) return title.trim() && abstract.trim() && keywords.trim();
    if (step === 1) return !!user?.name && !!user?.email && orcid.trim().length > 0;
    if (step === 2) return hasRequiredSubmissionUploads(uploadFiles);
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
          orcid: orcid.trim(),
          isCorresponding: true,
        },
      ];

      const submission = await submissionsApi.create({
        title: capitalizeFirstLetter(title),
        abstractText: abstract,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        language: DEFAULT_LANGUAGE,
        articleType,
        authors,
        saveAsDraft,
      });

      const uploadTasks = SUBMISSION_UPLOAD_SLOTS.flatMap((slot) => {
        const files = filesFromUpload(uploadFiles[slot.id]);
        if (files.length === 0) return [];
        return [uploadSubmissionFiles(submission.id, files, slot.backendType)];
      });

      await Promise.all(uploadTasks);

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

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Submissions", href: routes.submissions },
        { label: "New" },
      ]}
    >
      <div className="mx-auto w-full max-w-4xl pb-8">
        <header className="mb-8 space-y-1">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
            Create submission
          </h1>
          <p className="text-sm text-muted-foreground lg:hidden">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
        </header>

        <div className="lg:flex lg:gap-14">
          <aside className="sticky top-8 hidden w-[220px] shrink-0 self-start pt-2 lg:block">
            <p className="mb-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              New submission
            </p>
            <nav className="space-y-4" aria-label="Submission steps">
              {STEPS.map((label, index) => {
                const isCurrent = index === step;
                const isComplete = index < step;

                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                      {isCurrent ? (
                        <div
                          className="h-4 w-4 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500"
                          aria-hidden
                        />
                      ) : isComplete ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-card text-foreground">
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-card text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCurrent
                          ? "text-orange-600"
                          : isComplete
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-6 lg:hidden">
              <div
                className="h-0.5 overflow-hidden rounded-full bg-border/80"
                role="progressbar"
                aria-valuenow={step + 1}
                aria-valuemin={1}
                aria-valuemax={STEPS.length}
                aria-label={`Step ${step + 1} of ${STEPS.length}`}
              >
                <div
                  className="h-full rounded-full bg-foreground/70 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className={cn("space-y-6", step === 3 ? "max-w-xl" : "max-w-lg")}>
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="submission-title">Title</Label>
                    <Input
                      id="submission-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Manuscript title"
                      className="h-10 rounded-lg border-border/80 bg-card text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="submission-abstract">Abstract</Label>
                    <Textarea
                      id="submission-abstract"
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      placeholder="Brief summary of your work"
                      className="min-h-36 rounded-lg border-border/80 bg-card text-sm leading-relaxed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="submission-keywords">Keywords</Label>
                    <KeywordSuggestInput
                      id="submission-keywords"
                      value={keywords}
                      onChange={setKeywords}
                      suggestions={keywordSuggestions}
                      placeholder="e.g. ecology, climate, biodiversity"
                      className="min-h-10 rounded-lg border-border/80 bg-card text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Suggestions from keywords used in this journal.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Article type</Label>
                    <Select value={articleType} onValueChange={setArticleType}>
                      <SelectTrigger className="h-10 rounded-lg border-border/80 bg-card text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Original Manuscript">Original Manuscript</SelectItem>
                        <SelectItem value="Invited Manuscript">Invited Manuscript</SelectItem>
                        <SelectItem value="Book Review">Book Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 1 && user && (
                <div className="space-y-8">
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Submitting as
                    </p>
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        name={user.name}
                        avatarUrl={user.avatarUrl}
                        className="h-11 w-11 shrink-0"
                        fallbackClassName="text-sm"
                      />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-base font-medium leading-snug text-foreground">
                          {user.name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                        {authorInstitution ? (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {authorInstitution}
                          </p>
                        ) : null}
                      </div>
                      <Link
                        to={routes.profile}
                        className="shrink-0 pt-0.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/60 pt-8">
                    <Label htmlFor="submission-orcid">ORCID</Label>
                    <Input
                      id="submission-orcid"
                      value={orcid}
                      onChange={(e) => setOrcid(e.target.value)}
                      placeholder="0000-0000-0000-0000"
                      required
                      className="h-10 rounded-lg border-border/80 bg-card text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your ORCID iD will appear on the published article.
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <SubmissionFilesStep
                  files={uploadFiles}
                  onSlotChange={setUploadSlot}
                  requiredSlots={REQUIRED_SUBMISSION_UPLOAD_SLOTS}
                  optionalSlots={OPTIONAL_SUBMISSION_UPLOAD_SLOTS}
                />
              )}

              {step === 3 && user && (
                <SubmissionReviewStep
                  title={title}
                  abstract={abstract}
                  keywords={keywords}
                  articleType={articleType}
                  authorName={user.name}
                  authorEmail={user.email}
                  authorInstitution={authorInstitution}
                  orcid={orcid}
                  uploadFiles={uploadFiles}
                  onEditArticle={() => setStep(0)}
                  onEditAuthor={() => setStep(1)}
                  onEditFiles={() => setStep(2)}
                />
              )}
            </div>

            <div className={cn("mt-10 flex items-center justify-between border-t border-border/60 pt-6", step === 3 ? "max-w-xl" : "max-w-lg")}>
              <Button
                type="button"
                variant="ghost"
                className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  className="h-9 rounded-lg px-5 text-sm"
                  disabled={!canNext()}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Continue
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg px-4 text-sm"
                    disabled={isSaving}
                    onClick={() => void handleSaveDraft()}
                  >
                    {isSaving ? "Saving…" : "Save draft"}
                  </Button>
                  <Button
                    type="button"
                    className="h-9 rounded-lg px-5 text-sm"
                    disabled={isSaving}
                    onClick={() => void handleSubmit()}
                  >
                    {isSaving ? "Submitting…" : "Submit"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default SubmissionCreatePage;
