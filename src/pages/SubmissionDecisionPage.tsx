import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { FileUpload, type UploadedFileMeta } from "@/components/shared/FileUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import { routes } from "@/app/routes";
import { canPerformDecision, buildSubmissionScope } from "@/lib/rbac/submissionAccess";
import { usePermissions } from "@/lib/rbac/usePermissions";
import { submissionsApi } from "@/lib/api/submissions";
import { workflowApi, type DecisionSlug, type RecommendationValue, type ScreeningDecision } from "@/lib/api/workflow";
import { uploadSubmissionFiles } from "@/lib/api/files";
import { ApiClientError } from "@/lib/api/client";
import { DECISION_CONFIG, isDecisionSlug, type DecisionSlug as UiDecisionSlug } from "@/lib/workflow/submissionActions";

const CONFIRM_PHRASES = {
  reject: "REJECT",
  revision: "REVISE",
} as const;

/** Maps the UI's decision-page slug to the real backend call. */
function submitDecision(id: string, slug: UiDecisionSlug, reason: string): Promise<unknown> {
  switch (slug) {
    case "screening-revision":
      return workflowApi.screen(id, "REQUEST_REVISION" as ScreeningDecision, reason);
    case "desk-reject":
      return workflowApi.screen(id, "DESK_REJECT" as ScreeningDecision, reason);
    case "minor-revision":
      return workflowApi.decide(id, "MINOR_REVISION" as DecisionSlug, reason);
    case "major-revision":
      return workflowApi.decide(id, "MAJOR_REVISION" as DecisionSlug, reason);
    case "reject":
      return workflowApi.decide(id, "REJECT" as DecisionSlug, reason);
    case "further-revision":
      return workflowApi.decide(id, "FURTHER_REVISION" as DecisionSlug, reason);
    case "reject-after-revision":
      return workflowApi.decide(id, "REJECT_AFTER_REVISION" as DecisionSlug, reason);
    case "review-minor-revision":
      return workflowApi.submitReview(id, "MINOR_REVISION" as RecommendationValue, reason);
    case "review-major-revision":
      return workflowApi.submitReview(id, "MAJOR_REVISION" as RecommendationValue, reason);
    case "review-reject":
      return workflowApi.submitReview(id, "REJECT" as RecommendationValue, reason);
    case "recommend-minor-revision":
      return workflowApi.submitRecommendation(id, "MINOR_REVISION" as RecommendationValue, reason);
    case "recommend-major-revision":
      return workflowApi.submitRecommendation(id, "MAJOR_REVISION" as RecommendationValue, reason);
    case "recommend-reject":
      return workflowApi.submitRecommendation(id, "REJECT" as RecommendationValue, reason);
    case "recommend-accept":
      return workflowApi.submitRecommendation(id, "ACCEPT" as RecommendationValue, reason);
  }
}

const SubmissionDecisionPage = () => {
  const { id, decision } = useParams<{ id: string; decision: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: submission } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => submissionsApi.get(id as string),
    enabled: !!id && !!user,
  });

  const [reason, setReason] = useState("");
  const [images, setImages] = useState<UploadedFileMeta[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const validDecision = decision && isDecisionSlug(decision) ? decision : null;
  const config = validDecision ? DECISION_CONFIG[validDecision] : null;

  usePermissions(
    submission && user ? buildSubmissionScope(submission, user.id) : undefined,
  );

  if (!id || !validDecision || !config) {
    return <Navigate to={routes.submissions} replace />;
  }

  if (!submission || !user) {
    return (
      <AuthenticatedLayout title="Submission Not Found">
        <p className="text-gray-500">This submission does not exist.</p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link to={routes.submissions}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Link>
        </Button>
      </AuthenticatedLayout>
    );
  }

  if (!canPerformDecision(submission, validDecision, user.roles, user.id)) {
    return <Navigate to={routes.submissionById(submission.id)} replace />;
  }

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Feedback required",
        description: "Please write a message before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const imageFiles = images.map((f) => f.file).filter((f): f is File => !!f);
      if (imageFiles.length > 0) {
        const feedbackKind = config.mode === "review" ? "REVIEW" : "DECISION";
        await uploadSubmissionFiles(submission.id, imageFiles, "DECISION_FEEDBACK", { feedbackKind });
      }

      await submitDecision(submission.id, validDecision, reason.trim());

      void queryClient.invalidateQueries({ queryKey: ["submission", submission.id] });
      void queryClient.invalidateQueries({ queryKey: ["submissions"] });

      toast({
        title:
          config.mode === "review"
            ? "Review submitted"
            : config.mode === "recommendation"
              ? "Recommendation submitted"
              : "Decision submitted",
        description: config.activityLabel,
      });
      navigate(routes.submissionById(submission.id));
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "That action failed. Please try again.";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (!reason.trim()) {
      toast({
        title: "Feedback required",
        description: "Please write a message before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (config.mode === "recommendation" && config.recommendation === "accept") {
      void handleSubmit();
      return;
    }

    setConfirmText("");
    setConfirmOpen(true);
  };

  const confirmPhrase = CONFIRM_PHRASES[config.variant];

  const handleConfirm = () => {
    if (confirmText.trim().toUpperCase() !== confirmPhrase) {
      toast({
        title: "Confirmation required",
        description: `Type ${confirmPhrase} to confirm this ${config.variant === "reject" ? "rejection" : "revision request"}.`,
        variant: "destructive",
      });
      return;
    }

    setConfirmOpen(false);
    void handleSubmit();
  };

  const isConfirmValid = confirmText.trim().toUpperCase() === confirmPhrase;

  return (
    <AuthenticatedLayout
      title={config.title}
      breadcrumbs={[
        { label: "Dashboard", href: routes.dashboard },
        { label: "Submissions", href: routes.submissions },
        { label: submission.submissionNumber, href: routes.submissionById(submission.id) },
        { label: config.title },
      ]}
    >
      <div className="max-w-2xl space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">{submission.submissionNumber}</p>
          <h2 className="text-lg font-semibold text-gray-900">{submission.title}</h2>
          <p className="text-sm text-gray-600 mt-2">{config.description}</p>
        </div>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {config.mode === "recommendation" ? "Recommendation Notes" : "Feedback for Author"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="decision-reason">Message</Label>
              <Textarea
                id="decision-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain your decision or recommendation."
                className="min-h-[160px] rounded-xl"
              />
            </div>

            {config.mode !== "recommendation" && (
              <>
                <FileUpload
                  label="Supporting images (optional)"
                  accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
                  files={images}
                  onChange={setImages}
                  maxFiles={5}
                  hint="PNG, JPG, GIF, WEBP up to 5 files"
                  addMoreLabel="Add more images"
                />
                <p className="text-xs text-gray-500 -mt-2">
                  Upload annotated screenshots or figures to help the author understand your feedback.
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                className="rounded-xl"
                variant={config.variant === "reject" ? "destructive" : "default"}
                disabled={submitting}
                onClick={handleSubmitClick}
              >
                {submitting ? "Submitting..." : config.submitLabel}
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to={routes.submissionById(submission.id)}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {config.variant === "reject" ? "Confirm Rejection" : "Confirm Revision Request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {config.variant === "reject"
                ? "This action cannot be undone. The author will be notified and will see your feedback."
                : "The author will be notified and asked to revise based on your feedback."}{" "}
              Type <span className="font-semibold text-gray-900">{confirmPhrase}</span> below to
              confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="decision-confirm">Confirmation</Label>
            <Input
              id="decision-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type ${confirmPhrase} to confirm`}
              className="rounded-xl"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={`rounded-xl ${
                config.variant === "reject"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }`}
              disabled={!isConfirmValid || submitting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              {submitting ? "Submitting..." : config.submitLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  );
};

export default SubmissionDecisionPage;
