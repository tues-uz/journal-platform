import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { workflowApi, type RecommendationValue } from "@/lib/api/workflow";
import { uploadSubmissionFiles } from "@/lib/api/files";
import { ApiClientError } from "@/lib/api/client";
import { REVIEW_RECOMMENDATIONS } from "@/lib/workflow/submissionActions";
import { cn } from "@/lib/utils";

type ReviewChoice = (typeof REVIEW_RECOMMENDATIONS)[number]["value"];

const REVIEW_CHOICE_META: Record<
  ReviewChoice,
  {
    confirmPhrase?: string;
    destructive?: boolean;
    selected: string;
    idle: string;
  }
> = {
  accept: {
    selected: "border-green-600 bg-green-50 text-green-800 ring-1 ring-green-600/20",
    idle: "border-border/80 text-foreground hover:border-green-200 hover:bg-green-50/50",
  },
  minor_revision: {
    confirmPhrase: "REVISE",
    selected: "border-sky-600 bg-sky-50 text-sky-800 ring-1 ring-sky-600/20",
    idle: "border-border/80 text-foreground hover:border-sky-200 hover:bg-sky-50/50",
  },
  major_revision: {
    confirmPhrase: "REVISE",
    selected: "border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600/20",
    idle: "border-border/80 text-foreground hover:border-amber-200 hover:bg-amber-50/50",
  },
  reject: {
    confirmPhrase: "REJECT",
    destructive: true,
    selected: "border-red-600 bg-red-50 text-red-800 ring-1 ring-red-600/20",
    idle: "border-border/80 text-foreground hover:border-red-200 hover:bg-red-50/50",
  },
};

const API_VALUE: Record<ReviewChoice, RecommendationValue> = {
  accept: "ACCEPT",
  minor_revision: "MINOR_REVISION",
  major_revision: "MAJOR_REVISION",
  reject: "REJECT",
};

interface ReviewerReviewFormProps {
  submissionId: string;
}

export function ReviewerReviewForm({ submissionId }: ReviewerReviewFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<ReviewChoice | "">("");
  const [comments, setComments] = useState("");
  const [images, setImages] = useState<UploadedFileMeta[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const resetForm = () => {
    setRecommendation("");
    setComments("");
    setImages([]);
    setConfirmText("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!recommendation) return;

      const trimmed = comments.trim();
      const imageFiles = images.map((f) => f.file).filter((f): f is File => !!f);
      if (imageFiles.length > 0) {
        await uploadSubmissionFiles(submissionId, imageFiles, "DECISION_FEEDBACK", {
          feedbackKind: "REVIEW",
        });
      }

      await workflowApi.submitReview(submissionId, API_VALUE[recommendation], trimmed);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });
      void queryClient.invalidateQueries({ queryKey: ["submission-activities", submissionId] });
      void queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast({ title: "Review submitted" });
      setConfirmOpen(false);
      setDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      const message =
        err instanceof ApiClientError ? err.message : "That action failed. Please try again.";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    },
  });

  const meta = recommendation ? REVIEW_CHOICE_META[recommendation] : null;
  const needsConfirm = !!meta?.confirmPhrase;
  const isConfirmValid =
    !needsConfirm || confirmText.trim().toUpperCase() === meta?.confirmPhrase;

  const handleSubmitClick = () => {
    if (!recommendation) {
      toast({ title: "Pick a recommendation", variant: "destructive" });
      return;
    }

    if (!comments.trim()) {
      toast({ title: "Write your review first", variant: "destructive" });
      return;
    }

    if (needsConfirm) {
      setConfirmText("");
      setConfirmOpen(true);
      return;
    }

    mutation.mutate();
  };

  const handleConfirm = () => {
    if (!isConfirmValid) {
      toast({
        title: "Confirmation required",
        description: `Type ${meta?.confirmPhrase} to confirm.`,
        variant: "destructive",
      });
      return;
    }
    mutation.mutate();
  };

  const selectedLabel =
    REVIEW_RECOMMENDATIONS.find((rec) => rec.value === recommendation)?.label ?? "";

  const canSubmit = !!recommendation && !!comments.trim() && !mutation.isPending;

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 rounded-lg border border-border/80 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Your review</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Read the manuscript, then submit your recommendation and comments.
          </p>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => setDialogOpen(true)}>
          Submit review
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open && !mutation.isPending) resetForm();
        }}
      >
        <DialogContent className="max-w-lg gap-0 p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-border/60 px-6 py-4">
            <DialogTitle>Submit review</DialogTitle>
            <DialogDescription>
              Choose your recommendation, write comments for the editor, and attach files if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="space-y-2">
              <Label>Recommendation</Label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Recommendation">
                {REVIEW_RECOMMENDATIONS.map((rec) => {
                  const selected = recommendation === rec.value;
                  const styles = REVIEW_CHOICE_META[rec.value];
                  return (
                    <button
                      key={rec.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setRecommendation(rec.value)}
                      className={cn(
                        "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                        selected ? styles.selected : styles.idle,
                      )}
                    >
                      {rec.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comments">Comments</Label>
              <Textarea
                id="review-comments"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                placeholder="Summarize strengths, weaknesses, and your reasoning."
                className="min-h-[140px] resize-y"
              />
            </div>

            <FileUpload
              label="Attachments"
              accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
              files={images}
              onChange={setImages}
              maxFiles={5}
              hint="Optional — annotated figures or screenshots"
              addMoreLabel="Add image"
            />
          </div>

          <DialogFooter className="border-t border-border/60 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              disabled={mutation.isPending}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSubmit}
              variant={meta?.destructive ? "destructive" : "default"}
              className={cn(
                !meta?.destructive &&
                  recommendation === "accept" &&
                  "bg-green-600 text-white hover:bg-green-700",
                !meta?.destructive &&
                  recommendation === "minor_revision" &&
                  "bg-sky-600 text-white hover:bg-sky-700",
                !meta?.destructive &&
                  recommendation === "major_revision" &&
                  "bg-amber-600 text-white hover:bg-amber-700",
              )}
              onClick={handleSubmitClick}
            >
              {mutation.isPending ? "Submitting…" : "Submit review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {meta?.destructive ? "Confirm rejection" : "Confirm recommendation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Submitting <span className="font-medium text-foreground">{selectedLabel}</span>. Type{" "}
              <span className="font-medium text-foreground">{meta?.confirmPhrase}</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="review-confirm">Confirmation</Label>
            <Input
              id="review-confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={`Type ${meta?.confirmPhrase}`}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={meta?.destructive ? "bg-destructive hover:bg-destructive/90" : undefined}
              disabled={!isConfirmValid || mutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              {mutation.isPending ? "Submitting…" : "Submit review"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
