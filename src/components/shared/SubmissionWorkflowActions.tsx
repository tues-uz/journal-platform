import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ClipboardCheck, RotateCcw, Search, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import {
  isAssignedHandlingEditor,
  isReadyForFinalEditorialDecision,
  WORKFLOW_STAGE_LABELS,
} from "@/lib/workflow/submissionActions";
import {
  getHandlingEditorIds,
  hasHandlingEditors,
} from "@/lib/workflow/handlingEditors";
import type { ReviewerAssignment, Submission, SubmissionStatus } from "@/lib/store/types";
import { useToast } from "@/hooks/use-toast";
import { routes } from "@/app/routes";
import { FileUpload, type UploadedFileMeta } from "@/components/shared/FileUpload";
import { PublicationProofDownloadList } from "@/components/shared/PublicationProofDownloadList";
import { ReviewerReviewForm } from "@/components/shared/ReviewerReviewForm";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { MANUSCRIPT_UPLOAD_ACCEPT, MANUSCRIPT_UPLOAD_HINT, inferPublicationFormat, PUBLICATION_UPLOAD_ACCEPT, PUBLICATION_UPLOAD_HINT } from "@/lib/files/submissionFiles";
import { cn } from "@/lib/utils";
import { workflowApi, type DecisionSlug } from "@/lib/api/workflow";
import { paymentsApi } from "@/lib/api/payments";
import { canBeginLayoutProduction } from "@/lib/payment/access";
import { usersApi } from "@/lib/api/users";
import { volumesApi } from "@/lib/api/volumes";
import { issuesApi } from "@/lib/api/issues";
import { uploadSubmissionFiles, type BackendPublicationFormat } from "@/lib/api/files";
import { ApiClientError } from "@/lib/api/client";
import { MIN_REVIEWERS } from "@/lib/store/types";
import { SEED_VERSION } from "@/lib/store/seed";
import {
  buildReviewerScope,
  countSubmittedReviews,
  countActiveReviewerInvites,
  getReviewerSlot,
  getReviewerSlots,
  isReviewerOnSubmission,
} from "@/lib/workflow/reviewers";

interface SubmissionWorkflowActionsProps {
  submission: Submission;
}

function ActionPanel({
  title,
  children,
  stacked = false,
}: {
  title: string;
  children: React.ReactNode;
  stacked?: boolean;
}) {
  return (
    <Card className="mb-4 rounded-lg border border-border/80 bg-card shadow-none">
      <CardHeader className="border-b border-border/80 px-5 py-3.5 pb-3.5">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          stacked ? "space-y-5 p-5" : "flex flex-wrap gap-2 px-4 py-3 pt-3",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

function EditorInviteCard({
  name,
  selected,
  onToggle,
}: {
  name: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex w-[148px] shrink-0 flex-col items-center rounded-xl border bg-card p-3 shadow-sm transition-all",
        selected
          ? "border-primary/40 ring-1 ring-primary/15"
          : "border-border/70 hover:border-border",
      )}
    >
      <div className="relative">
        <UserAvatar
          name={name}
          className="h-16 w-16"
          fallbackClassName="text-lg font-medium"
        />
        <span
          className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500"
          aria-hidden
        />
      </div>
      <p className="mt-3 w-full truncate text-center text-sm font-semibold text-foreground">
        {name}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">Handling editor</p>
      <Button
        type="button"
        variant={selected ? "default" : "outline"}
        size="sm"
        className={cn(
          "mt-3 h-8 w-full rounded-lg text-xs",
          !selected && "border-border/80 bg-background hover:bg-muted/50 hover:text-foreground",
        )}
        onClick={onToggle}
      >
        {selected ? "Selected" : "Select"}
      </Button>
    </div>
  );
}

function AssignedEditorCard({ name }: { name: string }) {
  return (
    <div className="flex w-[148px] shrink-0 flex-col items-center rounded-xl border border-border/70 bg-muted/15 p-3">
      <div className="relative">
        <UserAvatar
          name={name}
          className="h-16 w-16"
          fallbackClassName="text-lg font-medium"
        />
        <span
          className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary"
          aria-hidden
        />
      </div>
      <p className="mt-3 w-full truncate text-center text-sm font-semibold text-foreground">
        {name}
      </p>
      <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        Assigned
      </span>
    </div>
  );
}

const PRESCREEN_CHECKLIST = [
  "Manuscript fits the journal scope and article type",
  "Main document and supporting files are complete",
  "Formatting meets submission guidelines",
] as const;

function PrescreenDecisionRow({
  icon: Icon,
  title,
  description,
  tone = "neutral",
  recommended = false,
  onAction,
}: {
  icon: typeof ClipboardCheck;
  title: string;
  description: string;
  tone?: "neutral" | "danger";
  recommended?: boolean;
  onAction: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAction}
      className={cn(
        "group flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all",
        recommended
          ? "border-primary/25 bg-primary/[0.03] hover:border-primary/45 hover:bg-primary/[0.06]"
          : tone === "danger"
            ? "border-border/80 bg-card hover:border-red-200/80 hover:bg-red-50/40"
            : "border-border/80 bg-card hover:border-border hover:bg-muted/25",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          recommended && "bg-primary/10 text-primary",
          tone === "danger" && !recommended && "bg-muted text-muted-foreground group-hover:bg-red-100 group-hover:text-red-700",
          tone === "neutral" && !recommended && "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {recommended ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Recommended
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <ChevronRight
        className="h-5 w-5 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
}

function ReviewerInvitationPanel({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-4 rounded-lg border border-border/80 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Review invitation</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Accept to access the manuscript and submit your review.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDecline}>
          Decline
        </Button>
        <Button size="sm" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}

type EditorialChoice = "approve" | "minor-revision" | "major-revision" | "reject";

const EDITORIAL_DECISION_API: Record<EditorialChoice, DecisionSlug> = {
  approve: "ACCEPT",
  "minor-revision": "MINOR_REVISION",
  "major-revision": "MAJOR_REVISION",
  reject: "REJECT",
};

function HeEditorialDecisionPanel({
  submissionId,
  description,
}: {
  submissionId: string;
  description: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [choice, setChoice] = useState<EditorialChoice | "">("");
  const [comments, setComments] = useState("");
  const [images, setImages] = useState<UploadedFileMeta[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const options = [
    { value: "approve" as const, label: "Approve" },
    { value: "minor-revision" as const, label: "Minor revision" },
    { value: "major-revision" as const, label: "Major revision" },
    { value: "reject" as const, label: "Reject" },
  ];

  const choiceMeta: Record<
    EditorialChoice,
    { confirmPhrase?: string; destructive?: boolean; selected: string; idle: string }
  > = {
    approve: {
      selected: "border-green-600 bg-green-50 text-green-800 ring-1 ring-green-600/20",
      idle: "border-border/80 text-foreground hover:border-green-200 hover:bg-green-50/50",
    },
    "minor-revision": {
      confirmPhrase: "REVISE",
      selected: "border-sky-600 bg-sky-50 text-sky-800 ring-1 ring-sky-600/20",
      idle: "border-border/80 text-foreground hover:border-sky-200 hover:bg-sky-50/50",
    },
    "major-revision": {
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

  const meta = choice ? choiceMeta[choice] : null;
  const selectedLabel = options.find((option) => option.value === choice)?.label ?? "";
  const needsFeedback = choice !== "" && choice !== "approve";

  const resetForm = () => {
    setChoice("");
    setComments("");
    setImages([]);
    setConfirmText("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!choice) return;

      const trimmed = comments.trim();
      const imageFiles = images.map((file) => file.file).filter((file): file is File => !!file);
      if (imageFiles.length > 0) {
        await uploadSubmissionFiles(submissionId, imageFiles, "DECISION_FEEDBACK", {
          feedbackKind: "DECISION",
        });
      }

      await workflowApi.decide(
        submissionId,
        EDITORIAL_DECISION_API[choice],
        trimmed || undefined,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });
      void queryClient.invalidateQueries({ queryKey: ["submission-activities", submissionId] });
      void queryClient.invalidateQueries({ queryKey: ["submissions"] });

      if (choice === "approve") {
        toast({
          title: "Approved for publication",
          description: "The author has been asked to submit payment.",
        });
      } else {
        toast({ title: "Decision submitted" });
      }

      setConfirmOpen(false);
      setApproveConfirmOpen(false);
      setDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      const message =
        err instanceof ApiClientError ? err.message : "That action failed. Please try again.";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    },
  });

  const canSubmit =
    !!choice && (!needsFeedback || !!comments.trim()) && !mutation.isPending;

  const handleSubmitClick = () => {
    if (!choice) {
      toast({ title: "Pick a decision", variant: "destructive" });
      return;
    }

    if (needsFeedback && !comments.trim()) {
      toast({
        title: "Feedback required",
        description: "Write a message for the author before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (choice === "approve") {
      setApproveConfirmOpen(true);
      return;
    }

    setConfirmText("");
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    const phrase = meta?.confirmPhrase;
    if (phrase && confirmText.trim().toUpperCase() !== phrase) {
      toast({
        title: "Confirmation required",
        description: `Type ${phrase} to confirm.`,
        variant: "destructive",
      });
      return;
    }

    mutation.mutate();
  };

  const isConfirmValid =
    !meta?.confirmPhrase || confirmText.trim().toUpperCase() === meta.confirmPhrase;

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 rounded-lg border border-border/80 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Editorial decision</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => setDialogOpen(true)}>
          Choose decision
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
            <DialogTitle>Editorial decision</DialogTitle>
            <DialogDescription>
              Choose the outcome, write feedback for the author, and attach images if helpful.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Editorial decision">
                {options.map((option) => {
                  const selected = choice === option.value;
                  const styles = choiceMeta[option.value];
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setChoice(option.value)}
                      className={cn(
                        "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                        selected ? styles.selected : styles.idle,
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="he-decision-comments">
                {needsFeedback ? "Feedback for author" : "Comments (optional)"}
              </Label>
              <Textarea
                id="he-decision-comments"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                placeholder={
                  needsFeedback
                    ? "Explain what the author should change or why you are rejecting."
                    : "Optional note to include with the approval."
                }
                className="min-h-[120px] resize-y"
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
                  choice === "approve" &&
                  "bg-green-600 text-white hover:bg-green-700",
                !meta?.destructive &&
                  choice === "minor-revision" &&
                  "bg-sky-600 text-white hover:bg-sky-700",
                !meta?.destructive &&
                  choice === "major-revision" &&
                  "bg-amber-600 text-white hover:bg-amber-700",
              )}
              onClick={handleSubmitClick}
            >
              {mutation.isPending ? "Submitting…" : "Submit decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {meta?.destructive ? "Confirm rejection" : "Confirm revision request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Submitting <span className="font-medium text-foreground">{selectedLabel}</span>. Type{" "}
              <span className="font-medium text-foreground">{meta?.confirmPhrase}</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="he-decision-confirm">Confirmation</Label>
            <Input
              id="he-decision-confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={`Type ${meta?.confirmPhrase ?? ""}`}
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
              {mutation.isPending ? "Submitting…" : "Submit decision"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve for publication</AlertDialogTitle>
            <AlertDialogDescription>
              The author will be notified to pay the publication fee before layout begins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              disabled={mutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              {mutation.isPending ? "Submitting…" : "Approve & request payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function HePrescreeningPanel({
  onProceed,
  onReturn,
  onDeskReject,
}: {
  onProceed: () => void;
  onReturn: () => void;
  onDeskReject: () => void;
}) {
  return (
    <Card className="mb-4 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/60 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Handling editor
        </p>
        <h3 className="mt-1 font-sans text-lg font-semibold text-foreground">Pre-screening</h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Check scope and format, then decide whether this manuscript should go to peer review.
        </p>
      </div>

      <div className="border-b border-border/60 bg-muted/15 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Before you decide
        </p>
        <ul className="mt-3 space-y-2.5">
          {PRESCREEN_CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" aria-hidden />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <CardContent className="space-y-2.5 p-4">
        <PrescreenDecisionRow
          icon={ClipboardCheck}
          title="Proceed to peer review"
          description="Manuscript is suitable. Confirm to open reviewer assignment (R1 & R2)."
          recommended
          onAction={onProceed}
        />
        <PrescreenDecisionRow
          icon={RotateCcw}
          title="Return for correction"
          description="Send back to the author for formatting or technical fixes."
          onAction={onReturn}
        />
        <PrescreenDecisionRow
          icon={XCircle}
          title="Desk reject"
          description="Reject without peer review — out of scope or unsuitable."
          tone="danger"
          onAction={onDeskReject}
        />
      </CardContent>

      <div className="border-t border-border/60 bg-muted/10 px-5 py-4">
        <p className="text-sm font-medium text-foreground">What happens next?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          After you proceed, this panel is replaced by{" "}
          <span className="font-medium text-foreground">Invite peer reviewers</span> — search and
          invite R1 and R2 from reviewer cards.
        </p>
      </div>
    </Card>
  );
}

function ReviewerAssignmentPanel({
  reviewerSlots,
  availableReviewers,
  getReviewerName,
  acceptedCount,
  invitedCount,
  minReviewers,
  onInviteReviewers,
}: {
  reviewerSlots: ReviewerAssignment[];
  availableReviewers: { id: string; name: string }[];
  getReviewerName: (reviewerId: string) => string;
  acceptedCount: number;
  invitedCount: number;
  minReviewers: number;
  onInviteReviewers: (reviewers: { id: string; name: string }[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);

  const remainingInvites = Math.max(0, minReviewers - invitedCount);
  const canSelectMore = remainingInvites > 0;

  const filteredReviewers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableReviewers.filter(
      (reviewer) => !query || reviewer.name.toLowerCase().includes(query),
    );
  }, [availableReviewers, search]);

  const slotCards = Array.from({ length: minReviewers }, (_, index) => {
    const slot = reviewerSlots[index];
    return {
      label: `R${index + 1}`,
      name: slot ? getReviewerName(slot.reviewerId) : undefined,
      status: slot?.invitationStatus ?? ("empty" as const),
    };
  });

  const toggleReviewer = (reviewerId: string, checked: boolean) => {
    setSelectedReviewers((current) => {
      if (!checked) return current.filter((id) => id !== reviewerId);
      if (current.length >= remainingInvites) return current;
      return [...current, reviewerId];
    });
  };

  const selectedReviewerDetails = selectedReviewers
    .map((id) => availableReviewers.find((reviewer) => reviewer.id === id))
    .filter((reviewer): reviewer is { id: string; name: string } => !!reviewer);

  return (
    <Card className="mb-4 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/60 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Handling editor
        </p>
        <h3 className="mt-1 font-sans text-lg font-semibold text-foreground">Invite peer reviewers</h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Select {minReviewers} reviewers minimum (R1 and R2) for double-blind peer review.
        </p>
      </div>

      {canSelectMore ? (
        <div className="border-b border-border/60 bg-primary/[0.04] px-5 py-3.5">
          <p className="text-sm font-medium text-foreground">
            Select {remainingInvites} more reviewer{remainingInvites === 1 ? "" : "s"} —{" "}
            <span className="text-primary">{invitedCount}/{minReviewers} invited</span>
          </p>
        </div>
      ) : (
        <div className="border-b border-border/60 bg-amber-50/50 px-5 py-3.5">
          <p className="text-sm text-amber-900">
            {acceptedCount >= minReviewers
              ? "Both reviewers accepted — peer review is underway."
              : "Both reviewers invited — waiting for them to accept their invitations."}
          </p>
        </div>
      )}

      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Reviewer slots</p>
          <p className="text-xs text-muted-foreground">
            {acceptedCount}/{minReviewers} accepted · {invitedCount}/{minReviewers} invited
          </p>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {slotCards.map((slot) => (
            <ReviewerSlotCard
              key={slot.label}
              label={slot.label}
              name={slot.name}
              status={slot.status}
            />
          ))}
        </div>
      </div>

      {canSelectMore && availableReviewers.length > 0 ? (
        <>
          <div className="border-b border-border/60 px-4 py-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reviewers…"
                className="h-11 rounded-xl border-border/80 bg-background pl-9"
              />
            </div>
          </div>

          <div className="px-4 py-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Available reviewers ({filteredReviewers.length})
            </p>
            {filteredReviewers.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {filteredReviewers.map((reviewer) => {
                  const selected = selectedReviewers.includes(reviewer.id);
                  const selectDisabled =
                    !selected && selectedReviewers.length >= remainingInvites;
                  return (
                    <ReviewerInviteCard
                      key={reviewer.id}
                      name={reviewer.name}
                      selected={selected}
                      disabled={selectDisabled}
                      onToggle={() => toggleReviewer(reviewer.id, !selected)}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No reviewers match your search.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {selectedReviewers.length === 0
                ? `Select ${remainingInvites} reviewer${remainingInvites === 1 ? "" : "s"} to invite`
                : `${selectedReviewers.length} of ${remainingInvites} selected`}
            </p>
            <Button
              className="h-9 rounded-lg px-4"
              disabled={selectedReviewers.length === 0}
              onClick={() => {
                onInviteReviewers(selectedReviewerDetails);
                setSelectedReviewers([]);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {selectedReviewers.length === 0
                ? "Invite reviewers"
                : selectedReviewers.length === 1
                  ? "Invite 1 reviewer"
                  : `Invite ${selectedReviewers.length} reviewers`}
            </Button>
          </div>
        </>
      ) : canSelectMore ? (
        <div className="px-5 py-6">
          <p className="text-sm text-muted-foreground">
            Every available reviewer has already been invited to this manuscript.
          </p>
        </div>
      ) : null}
    </Card>
  );
}

function ReviewerSlotCard({
  label,
  name,
  status,
}: {
  label: string;
  name?: string;
  status: ReviewerAssignment["invitationStatus"] | "empty";
}) {
  const statusLabel =
    status === "accepted"
      ? "Accepted"
      : status === "pending"
        ? "Pending"
        : status === "declined"
          ? "Declined"
          : "Open slot";

  return (
    <div
      className={cn(
        "flex w-[148px] shrink-0 flex-col items-center rounded-xl border p-3",
        status === "accepted" && "border-primary/30 bg-primary/[0.03]",
        status === "pending" && "border-amber-200/80 bg-amber-50/30",
        status === "declined" && "border-border/70 bg-muted/15",
        status === "empty" && "border-dashed border-border/80 bg-muted/10",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {name ? (
        <>
          <UserAvatar
            name={name}
            className="mt-2 h-14 w-14"
            fallbackClassName="text-base font-medium"
          />
          <p className="mt-2 w-full truncate text-center text-sm font-semibold text-foreground">
            {name}
          </p>
          <span
            className={cn(
              "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
              status === "accepted" && "bg-primary/10 text-primary",
              status === "pending" && "bg-amber-100 text-amber-800",
              status === "declined" && "bg-muted text-muted-foreground",
            )}
          >
            {statusLabel}
          </span>
        </>
      ) : (
        <>
          <div className="mt-2 flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border/80 bg-background">
            <UserPlus className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Not assigned</p>
          <span className="mt-1.5 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {statusLabel}
          </span>
        </>
      )}
    </div>
  );
}

function ReviewerInviteCard({
  name,
  selected,
  disabled,
  onToggle,
}: {
  name: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex w-[148px] shrink-0 flex-col items-center rounded-xl border bg-card p-3 shadow-sm transition-all",
        selected
          ? "border-primary/40 ring-1 ring-primary/15"
          : "border-border/70 hover:border-border",
        disabled && !selected && "opacity-50",
      )}
    >
      <UserAvatar
        name={name}
        className="h-16 w-16"
        fallbackClassName="text-lg font-medium"
      />
      <p className="mt-3 w-full truncate text-center text-sm font-semibold text-foreground">
        {name}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">Reviewer</p>
      <Button
        type="button"
        variant={selected ? "default" : "outline"}
        size="sm"
        className={cn(
          "mt-3 h-8 w-full rounded-lg text-xs",
          !selected && "border-border/80 bg-background hover:bg-muted/50 hover:text-foreground",
        )}
        disabled={disabled}
        onClick={onToggle}
      >
        {selected ? "Selected" : "Select"}
      </Button>
    </div>
  );
}

function HandlingEditorAssignmentPanel({
  assignedEditorIds,
  availableEditors,
  selectedEditors,
  getEditorName,
  onToggleEditor,
  onAssign,
  assignDisabled,
}: {
  assignedEditorIds: string[];
  availableEditors: { id: string; name: string }[];
  selectedEditors: string[];
  getEditorName: (editorId: string) => string;
  onToggleEditor: (editorId: string, checked: boolean) => void;
  onAssign: () => void;
  assignDisabled: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "selected">("all");

  const filteredEditors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableEditors.filter((editor) => {
      const matchesSearch = !query || editor.name.toLowerCase().includes(query);
      const matchesFilter =
        filter === "all" || selectedEditors.includes(editor.id);
      return matchesSearch && matchesFilter;
    });
  }, [availableEditors, filter, search, selectedEditors]);

  return (
    <Card className="mb-4 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/60 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Editor in Chief
        </p>
        <h3 className="mt-1 font-sans text-lg font-semibold text-foreground">
          Assign handling editors
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Select one or more editors below, then click Invite. You can invite additional editors
          later.
        </p>
      </div>

      <div className="border-b border-border/60 px-4 py-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search handling editors…"
            className="h-11 rounded-xl border-border/80 bg-background pl-9"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "selected"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === value
                  ? "bg-sky-50 text-sky-700"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {value === "all" ? "All" : "Selected"}
            </button>
          ))}
        </div>
      </div>

      {assignedEditorIds.length > 0 ? (
        <div className="border-b border-border/60 px-4 py-4">
          <p className="mb-3 text-sm text-muted-foreground">
            On this manuscript ({assignedEditorIds.length})
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {assignedEditorIds.map((editorId) => (
              <AssignedEditorCard key={editorId} name={getEditorName(editorId)} />
            ))}
          </div>
        </div>
      ) : null}

      {availableEditors.length > 0 ? (
        <>
          <div className="px-4 py-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Available editors ({filteredEditors.length})
            </p>
            {filteredEditors.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {filteredEditors.map((editor) => {
                  const selected = selectedEditors.includes(editor.id);
                  return (
                    <EditorInviteCard
                      key={editor.id}
                      name={editor.name}
                      selected={selected}
                      onToggle={() => onToggleEditor(editor.id, !selected)}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No editors match your search.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {selectedEditors.length === 0
                ? "Select one or more editors to invite"
                : `${selectedEditors.length} editor${selectedEditors.length === 1 ? "" : "s"} selected`}
            </p>
            <Button className="h-9 rounded-lg px-4" disabled={assignDisabled} onClick={onAssign}>
              <UserPlus className="mr-2 h-4 w-4" />
              {selectedEditors.length === 0
                ? "Invite"
                : selectedEditors.length === 1
                  ? "Invite 1 editor"
                  : `Invite ${selectedEditors.length} editors`}
            </Button>
          </div>
        </>
      ) : (
        <div className="px-4 py-6">
          <p className="text-sm text-muted-foreground">
            Every available handling editor is already on this manuscript.
          </p>
        </div>
      )}
    </Card>
  );
}

const ACCEPT_CONFIRM_PHRASE = "ACCEPT";

interface PendingConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  requireAcceptPhrase?: boolean;
  inviteEditors?: { id: string; name: string }[];
  inviteReviewers?: { id: string; name: string }[];
  onConfirm: () => void | Promise<void>;
}

const filesToRaw = (files: UploadedFileMeta[]): File[] =>
  files.map((f) => f.file).filter((f): f is File => !!f);

export function SubmissionWorkflowActions({ submission }: SubmissionWorkflowActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const reviewerSlots = getReviewerSlots(submission);
  const acceptedReviewers = reviewerSlots.filter((r) => r.invitationStatus === "accepted");
  const invitedReviewerCount = countActiveReviewerInvites(submission);
  const submittedReviewCount = countSubmittedReviews(submission);
  const myReviewerSlot = user ? getReviewerSlot(submission, user.id) : undefined;
  const reviewerScope = user ? buildReviewerScope(submission, user.id) : undefined;

  const { can, roles, isAdmin } = usePermissions({
    handlingEditorId: submission.handlingEditorId,
    handlingEditorIds: getHandlingEditorIds(submission),
    submissionAuthorId: submission.authorId,
    currentUserId: user?.id,
    ...reviewerScope,
  });

  const assignedEditorIds = getHandlingEditorIds(submission);
  const isAuthor = submission.authorId === user?.id;
  const isEic = roles.includes("editor_in_chief");
  const isHandlingEditorRole = roles.includes("handling_editor");
  const isReviewerRole = roles.includes("reviewer");
  const isMyAssignment = isAssignedHandlingEditor(submission, user?.id);
  const isMyLayoutAssignment = isMyAssignment && isHandlingEditorRole;

  const canAssignEditor = can("editor_assignment", "assign") || isAdmin;
  const canAssignReviewer = can("reviewer_assignment", "assign") && isMyAssignment;
  const canPublish = can("publication", "publish") || isAdmin;
  const canSchedulePublication = (can("publication", "edit") && isMyLayoutAssignment) || isAdmin;
  const showPublishPanel =
    canPublish && submission.status === "production" && submission.proofApproved;
  const showScheduledPublishPanel =
    canPublish && submission.status === "scheduled";
  const showHeSchedulePanel =
    canSchedulePublication &&
    submission.status === "production" &&
    submission.files.some((file) => file.type === "publication");
  const hasAuthorRevisionPending =
    submission.status === "assigned" && (submission.revisionRound ?? 0) > 0;

  const { data: handlingEditors = [] } = useQuery({
    queryKey: ["users", "candidates", "HANDLING_EDITOR", SEED_VERSION],
    queryFn: () => usersApi.candidates("HANDLING_EDITOR"),
    staleTime: 0,
    enabled:
      canAssignEditor &&
      (submission.status === "submitted" || submission.status === "assigned"),
  });
  const { data: reviewers = [] } = useQuery({
    queryKey: ["users", "candidates", "REVIEWER"],
    queryFn: () => usersApi.candidates("REVIEWER"),
    enabled: canAssignReviewer && submission.status === "assigned",
  });
  const { data: volumes = [] } = useQuery({
    queryKey: ["volumes"],
    queryFn: () => volumesApi.list(),
    enabled: showPublishPanel || showHeSchedulePanel,
  });
  const { data: issues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => issuesApi.list(),
    enabled: showPublishPanel || showHeSchedulePanel,
  });
  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: () => paymentsApi.getSettings(),
  });
  const paymentEnabled = paymentSettings?.enabled ?? true;
  const showHeLayoutPanel =
    isMyLayoutAssignment &&
    can("layout_production", "decide") &&
    canBeginLayoutProduction(submission, paymentEnabled);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["submission", submission.id] });
    void queryClient.invalidateQueries({ queryKey: ["submission-activities", submission.id] });
    void queryClient.invalidateQueries({ queryKey: ["submissions"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const mutation = useMutation({
    mutationFn: (action: () => Promise<Submission>) => action(),
    onSuccess: () => invalidate(),
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "That action failed. Please try again.";
      toast({ title: "Action failed", description: message, variant: "destructive" });
    },
  });

  const [selectedEditors, setSelectedEditors] = useState<string[]>([]);
  const [selectedVolumeId, setSelectedVolumeId] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [revisionFiles, setRevisionFiles] = useState<UploadedFileMeta[]>([]);
  const [publicationFiles, setPublicationFiles] = useState<UploadedFileMeta[]>([]);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);

  if (!user) return null;

  const openConfirm = (action: PendingConfirmAction) => {
    setPendingConfirm(action);
    setConfirmText("");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingConfirm || confirming) return;

    if (
      pendingConfirm.requireAcceptPhrase &&
      confirmText.trim().toUpperCase() !== ACCEPT_CONFIRM_PHRASE
    ) {
      toast({
        title: "Confirmation required",
        description: `Type ${ACCEPT_CONFIRM_PHRASE} to confirm this action.`,
        variant: "destructive",
      });
      return;
    }

    setConfirming(true);
    try {
      await pendingConfirm.onConfirm();
      setConfirmOpen(false);
      setPendingConfirm(null);
      setConfirmText("");
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "That action failed. Please try again.";
      toast({ title: "Action failed", description: message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const isConfirmValid =
    !pendingConfirm?.requireAcceptPhrase ||
    confirmText.trim().toUpperCase() === ACCEPT_CONFIRM_PHRASE;

  const panels: React.ReactNode[] = [];

  const availableEditors = handlingEditors.filter(
    (editor) => !assignedEditorIds.includes(editor.id),
  );
  const canShowEditorAssignmentPanel =
    canAssignEditor &&
    (submission.status === "submitted" || submission.status === "assigned");
  const canShowAssignPanel =
    canShowEditorAssignmentPanel &&
    (assignedEditorIds.length > 0 || availableEditors.length > 0);

  const getEditorName = (editorId: string) =>
    handlingEditors.find((editor) => editor.id === editorId)?.name ??
    (editorId === submission.handlingEditorId ? submission.handlingEditorName : undefined) ??
    "Handling Editor";

  const toggleSelectedEditor = (editorId: string, checked: boolean) => {
    setSelectedEditors((current) => {
      if (!checked) return current.filter((id) => id !== editorId);
      if (current.includes(editorId)) return current;
      return [...current, editorId];
    });
  };

  // ── EIC / Admin: Assign Handling Editor(s) ──
  if (canShowAssignPanel) {
    panels.push(
      <HandlingEditorAssignmentPanel
        key="assign-editor"
        assignedEditorIds={assignedEditorIds}
        availableEditors={availableEditors}
        selectedEditors={selectedEditors}
        getEditorName={getEditorName}
        onToggleEditor={toggleSelectedEditor}
        assignDisabled={selectedEditors.length === 0}
        onAssign={() => {
          const editors = selectedEditors.map((id) => ({
            id,
            name: getEditorName(id),
          }));

          openConfirm({
            title: "Invite handling editors",
            description:
              editors.length === 1
                ? "They'll receive a notification and can begin managing this manuscript."
                : "They'll receive notifications and can begin managing this manuscript.",
            inviteEditors: editors,
            confirmLabel: editors.length === 1 ? "Send invite" : "Send invites",
            onConfirm: async () => {
              for (const editorId of selectedEditors) {
                await mutation.mutateAsync(() =>
                  workflowApi.assignEditor(submission.id, editorId),
                );
              }
              toast({
                title:
                  selectedEditors.length === 1
                    ? "Handling editor invited"
                    : "Handling editors invited",
              });
              setSelectedEditors([]);
            },
          });
        }}
      />,
    );
  }

  // ── Handling Editor: Accept assignment when none assigned yet ──
  if (
    isHandlingEditorRole &&
    submission.status === "assigned" &&
    !hasHandlingEditors(submission)
  ) {
    panels.push(
      <ActionPanel key="he-accept" title="Handling Editor — Accept Assignment">
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Accept Assignment",
              description: "You will become the handling editor for this submission.",
              confirmLabel: "Accept Assignment",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.assignEditor(submission.id, user.id));
                toast({ title: "You are now the handling editor for this submission" });
              },
            })
          }
        >
          Accept as Handling Editor
        </Button>
      </ActionPanel>,
    );
  }

  // ── Handling Editor: Pre-screening ──
  if (
    isMyAssignment &&
    isHandlingEditorRole &&
    can("he_prescreening", "decide") &&
    submission.status === "assigned" &&
    hasHandlingEditors(submission) &&
    !submission.hePrescreenComplete
  ) {
    panels.push(
      <HePrescreeningPanel
        key="he-prescreen"
        onProceed={() =>
          openConfirm({
            title: "Proceed to Peer Review",
            description: "This manuscript will move to reviewer assignment. You'll invite R1 and R2 next.",
            confirmLabel: "Continue",
            onConfirm: async () => {
              await mutation.mutateAsync(() =>
                workflowApi.hePrescreen(submission.id, "SEND_TO_REVIEW"),
              );
              toast({
                title: "Ready for reviewer assignment",
                description: "Choose R1 and R2 in the panel below.",
              });
            },
          })
        }
        onReturn={() =>
          openConfirm({
            title: "Return for Correction",
            description: "Send the manuscript back to the author for technical corrections.",
            confirmLabel: "Return",
            onConfirm: async () => {
              await mutation.mutateAsync(() =>
                workflowApi.hePrescreen(submission.id, "RETURN", "Returned for technical correction"),
              );
              toast({ title: "Returned to author for correction" });
            },
          })
        }
        onDeskReject={() =>
          openConfirm({
            title: "Desk Reject",
            description: "Reject this manuscript at pre-screening.",
            confirmLabel: "Desk Reject",
            destructive: true,
            onConfirm: async () => {
              await mutation.mutateAsync(() =>
                workflowApi.hePrescreen(submission.id, "DESK_REJECT", "Desk rejected at HE pre-screening"),
              );
              toast({ title: "Manuscript desk rejected" });
            },
          })
        }
      />,
    );
  }

  // ── Handling Editor: Reviewer assignment ──
  if (
    canAssignReviewer &&
    submission.status === "assigned" &&
    submission.hePrescreenComplete &&
    invitedReviewerCount < MIN_REVIEWERS
  ) {
    const invitedIds = new Set(reviewerSlots.map((slot) => slot.reviewerId));
    const availableReviewers = reviewers.filter((reviewer) => !invitedIds.has(reviewer.id));
    const getReviewerName = (reviewerId: string) =>
      reviewers.find((reviewer) => reviewer.id === reviewerId)?.name ?? "Reviewer";

    panels.push(
      <ReviewerAssignmentPanel
        key="reviewer-assignment"
        reviewerSlots={reviewerSlots}
        availableReviewers={availableReviewers}
        getReviewerName={getReviewerName}
        acceptedCount={acceptedReviewers.length}
        invitedCount={invitedReviewerCount}
        minReviewers={MIN_REVIEWERS}
        onInviteReviewers={(selected) =>
          openConfirm({
            title:
              selected.length === 1 ? "Invite Reviewer" : `Invite ${selected.length} Reviewers`,
            description:
              selected.length === 1
                ? `Send a peer review invitation to ${selected[0]?.name ?? "the selected reviewer"}.`
                : `Send peer review invitations to ${selected.map((reviewer) => reviewer.name).join(" and ")}.`,
            confirmLabel:
              selected.length === 1 ? "Send Invitation" : `Invite ${selected.length} reviewers`,
            inviteReviewers: selected,
            onConfirm: async () => {
              for (const reviewer of selected) {
                await mutation.mutateAsync(() =>
                  workflowApi.inviteReviewer(submission.id, reviewer.id),
                );
              }
              toast({
                title:
                  selected.length === 1
                    ? `${selected[0]?.name} invited to review`
                    : `${selected.length} reviewers invited`,
              });
            },
          })
        }
      />,
    );
  }

  if (
    canAssignReviewer &&
    submission.status === "assigned" &&
    submission.hePrescreenComplete &&
    invitedReviewerCount >= MIN_REVIEWERS &&
    acceptedReviewers.length < MIN_REVIEWERS
  ) {
    panels.push(
      <ActionPanel key="await-reviewers" title="Awaiting Reviewer Responses">
        <p className="w-full text-sm text-muted-foreground">
          {invitedReviewerCount}/{MIN_REVIEWERS} reviewers invited · {acceptedReviewers.length}/
          {MIN_REVIEWERS} accepted. Peer review starts once both accept.
        </p>
      </ActionPanel>,
    );
  }

  // ── Reviewer: Accept / decline invitation ──
  if (can("reviewer_invitation", "decide") && myReviewerSlot?.invitationStatus === "pending") {
    panels.push(
      <ReviewerInvitationPanel
        key="invitation"
        onAccept={() =>
          openConfirm({
            title: "Accept review invitation",
            description: "You will be assigned to review this manuscript.",
            confirmLabel: "Accept",
            onConfirm: async () => {
              await mutation.mutateAsync(() => workflowApi.respondToInvitation(submission.id, true));
              toast({ title: "Review invitation accepted" });
            },
          })
        }
        onDecline={() =>
          openConfirm({
            title: "Decline review invitation",
            description: "You will decline this review invitation.",
            confirmLabel: "Decline",
            onConfirm: async () => {
              await mutation.mutateAsync(() => workflowApi.respondToInvitation(submission.id, false));
              toast({ title: "Review invitation declined" });
            },
          })
        }
      />,
    );
  }

  // ── Reviewer: Submit review ──
  if (
    can("peer_review", "decide") &&
    submission.status === "under_review" &&
    myReviewerSlot?.invitationStatus === "accepted" &&
    !myReviewerSlot.reviewSubmitted
  ) {
    panels.push(<ReviewerReviewForm key="review" submissionId={submission.id} />);
  }

  // ── Handling Editor: Editorial decision after reviews ──
  const canHeDecideAfterReview =
    isMyAssignment &&
    isHandlingEditorRole &&
    submission.status === "under_review" &&
    can("editorial_decision", "decide") &&
    isReadyForFinalEditorialDecision(submission);

  if (canHeDecideAfterReview) {
    panels.push(
      <HeEditorialDecisionPanel
        key="he-decision"
        submissionId={submission.id}
        description="Both reviewer reports are in. Choose the next step for this manuscript."
      />,
    );
  }

  // ── Handling Editor: Review author revision ──
  if (
    isMyAssignment &&
    isHandlingEditorRole &&
    hasAuthorRevisionPending &&
    can("editorial_decision", "decide")
  ) {
    panels.push(
      <HeEditorialDecisionPanel
        key="he-revision-review"
        submissionId={submission.id}
        description={`The author submitted a revised manuscript (round ${submission.revisionRound ?? 1}). Review it and choose the next step.`}
      />,
    );
  }

  if (
    isMyAssignment &&
    isHandlingEditorRole &&
    submission.status === "under_review" &&
    !isReadyForFinalEditorialDecision(submission)
  ) {
    panels.push(
      <ActionPanel key="he-await-reviews" title="Handling Editor — Awaiting Reviews">
        <p className="w-full text-sm text-gray-600">
          Waiting for both reviewers to submit their reports before you can make an editorial
          decision.
        </p>
      </ActionPanel>,
    );
  }

  // ── Author: Upload revision ──
  if (isAuthor && can("revision", "create") && submission.status === "revision_required") {
    panels.push(
      <ActionPanel key="revision" title="Author — Upload Revised Manuscript">
        <div className="w-full">
          <FileUpload
            label="Upload revised manuscript"
            accept={MANUSCRIPT_UPLOAD_ACCEPT}
            hint={MANUSCRIPT_UPLOAD_HINT}
            files={revisionFiles}
            onChange={setRevisionFiles}
            maxFiles={1}
          />
        </div>
        <Button
          className="rounded-xl"
          disabled={revisionFiles.length === 0}
          onClick={() =>
            openConfirm({
              title: "Submit Revision",
              description:
                "Upload your revised manuscript. Your handling editor will review it next.",
              confirmLabel: "Submit Revision",
              onConfirm: async () => {
                const rawFiles = filesToRaw(revisionFiles);
                if (rawFiles.length === 0) {
                  throw new ApiClientError(400, "Upload a revised manuscript first.");
                }
                await mutation.mutateAsync(async () => {
                  await uploadSubmissionFiles(submission.id, rawFiles, "REVISION");
                  return workflowApi.submitRevision(submission.id);
                });
                toast({
                  title: "Revision submitted",
                  description: "Your handling editor will review your revision next.",
                });
                setRevisionFiles([]);
              },
            })
          }
        >
          Submit Revision
        </Button>
      </ActionPanel>,
    );
  }

  // ── Author: Payment after acceptance ──
  if (isAuthor && submission.status === "payment_pending") {
    panels.push(
      <div
        key="accept-payment"
        className="mb-4 flex flex-col gap-4 rounded-lg border border-border/80 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Publication payment due</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your manuscript was approved. Pay the APC so layout and production can begin.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0 rounded-lg">
          <Link to={routes.authorPaymentDetail(submission.id)}>Pay now</Link>
        </Button>
      </div>,
    );
  }

  // ── Handling Editor: Awaiting author APC ──
  if (
    isMyAssignment &&
    isHandlingEditorRole &&
    submission.status === "payment_pending"
  ) {
    panels.push(
      <ActionPanel key="he-await-payment" title="Awaiting author payment">
        <p className="w-full text-sm text-gray-600">
          The author must pay the publication fee (APC) and have it verified by admin before
          layout can begin.
        </p>
      </ActionPanel>,
    );
  }

  // ── Handling Editor: layout, upload publication files, send for proof ──
  if (showHeLayoutPanel) {
    const hasPublicationFile = submission.files.some((f) => f.type === "publication");
    panels.push(
      <ActionPanel key="layout" title="Layout & Production">
        {!submission.layoutStartedAt && (
          <Button
            className="rounded-xl"
            onClick={() =>
              openConfirm({
                title: "Start Layout",
                description: "Begin layout and typesetting for this manuscript.",
                confirmLabel: "Start Layout",
                onConfirm: async () => {
                  await mutation.mutateAsync(() => workflowApi.startLayout(submission.id));
                  toast({ title: "Layout started" });
                },
              })
            }
          >
            Start Layout
          </Button>
        )}
        {submission.layoutStartedAt && (
          <>
            <div className="w-full">
              <FileUpload
                label="Upload publication-ready file"
                description={PUBLICATION_UPLOAD_HINT}
                accept={PUBLICATION_UPLOAD_ACCEPT}
                hint={PUBLICATION_UPLOAD_HINT}
                files={publicationFiles}
                onChange={setPublicationFiles}
                maxFiles={5}
              />
            </div>
            <Button
              variant="outline"
              className="rounded-xl bg-white"
              disabled={publicationFiles.length === 0}
              onClick={() =>
                openConfirm({
                  title: "Upload Publication File",
                  description: "Upload the publication-ready file(s) for this manuscript.",
                  confirmLabel: "Upload",
                  onConfirm: async () => {
                    for (const meta of publicationFiles) {
                      if (!meta.file) continue;
                      const format = inferPublicationFormat(meta.name).toUpperCase() as BackendPublicationFormat;
                      await uploadSubmissionFiles(submission.id, [meta.file], "PUBLICATION", { format });
                    }
                    invalidate();
                    toast({ title: "Publication file(s) uploaded" });
                    setPublicationFiles([]);
                  },
                })
              }
            >
              Upload File
            </Button>
            <Button
              className="rounded-xl"
              disabled={!hasPublicationFile}
              onClick={() =>
                openConfirm({
                  title: "Send for Author Proof",
                  description: "Send this layout to the author for proofreading approval.",
                  confirmLabel: "Send for Proof",
                  onConfirm: async () => {
                    await mutation.mutateAsync(() => workflowApi.sendForProof(submission.id));
                    toast({ title: "Sent for author proof" });
                  },
                })
              }
            >
              Send for Proof
            </Button>
            {!hasPublicationFile && (
              <p className="w-full text-xs text-amber-700">
                Upload at least one publication-ready file before sending for proof.
              </p>
            )}
          </>
        )}
      </ActionPanel>,
    );
  }

  // ── Author: Proofreading ──
  if (
    isAuthor &&
    can("proofreading", "decide") &&
    submission.proofReady &&
    !submission.proofApproved &&
    submission.status === "production"
  ) {
    panels.push(
      <ActionPanel key="proof" title="Proofreading — Approve or Request Corrections">
        <PublicationProofDownloadList submissionId={submission.id} files={submission.files} />
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Approve Proof",
              description: "Approve the layout proof. The publisher will be notified to finalize publication.",
              confirmLabel: "Approve Proof",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.respondToProof(submission.id, true));
                toast({ title: "Proof approved", description: "The publisher will finalize publication." });
              },
            })
          }
        >
          Approve Proof
        </Button>
        <Button
          variant="outline"
          className="rounded-xl bg-white"
          onClick={() =>
            openConfirm({
              title: "Request Correction",
              description: "Send the proof back to the handling editor for corrections.",
              confirmLabel: "Request Correction",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.respondToProof(submission.id, false));
                toast({ title: "Correction request sent to handling editor" });
              },
            })
          }
        >
          Request Correction
        </Button>
      </ActionPanel>,
    );
  }

  // ── Author: Proof approved, awaiting publisher ──
  if (isAuthor && submission.status === "production" && submission.proofApproved) {
    panels.push(
      <ActionPanel key="proof-done" title="Proofreading — Complete">
        <p className="w-full text-sm text-gray-600">
          You approved the proof. The publisher will publish this article next.
        </p>
      </ActionPanel>,
    );
  }

  // ── Publisher / Admin: Awaiting author proof ──
  if (
    (can("publication", "publish") || isAdmin) &&
    submission.status === "production" &&
    submission.proofReady &&
    !submission.proofApproved
  ) {
    panels.push(
      <ActionPanel key="await-proof" title="Publisher / Admin — Awaiting Author Proof">
        <p className="w-full text-sm text-gray-600">
          The proof has been sent to the author. Publishing unlocks after they approve it.
        </p>
      </ActionPanel>,
    );
  }

  // ── Handling Editor: Schedule publication ──
  if (showHeSchedulePanel) {
    panels.push(
      <ActionPanel key="he-schedule" title="Handling Editor — Schedule Publication">
        <p className="w-full text-sm text-gray-600 mb-1">
          Layout files are ready. Choose a publication date for the publisher to finalize.
        </p>
        <Input
          type="date"
          value={selectedScheduleDate}
          onChange={(e) => setSelectedScheduleDate(e.target.value)}
          className="w-48 rounded-xl bg-white"
        />
        <Button
          className="rounded-xl"
          disabled={!selectedScheduleDate}
          onClick={() =>
            openConfirm({
              title: "Schedule Publication",
              description: `Schedule this article for ${selectedScheduleDate}.`,
              confirmLabel: "Schedule",
              onConfirm: async () => {
                await mutation.mutateAsync(() =>
                  workflowApi.schedulePublication(
                    submission.id,
                    new Date(selectedScheduleDate).toISOString(),
                  ),
                );
                toast({ title: "Publication scheduled" });
                setSelectedScheduleDate("");
              },
            })
          }
        >
          Schedule Publication
        </Button>
      </ActionPanel>,
    );
  }

  // ── Publisher / Admin: Publish ──
  if (showPublishPanel) {
    const issuesForVolume = issues.filter((i) => i.volumeId === selectedVolumeId);
    panels.push(
      <ActionPanel key="publish" title="Publisher / Admin — Publish Article">
        <div className="w-full flex flex-wrap gap-2">
          <Select
            value={selectedVolumeId}
            onValueChange={(value) => {
              setSelectedVolumeId(value);
              setSelectedIssueId("");
            }}
          >
            <SelectTrigger className="w-48 rounded-xl bg-white">
              <SelectValue placeholder="Select volume" />
            </SelectTrigger>
            <SelectContent>
              {volumes.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  Volume {v.number} ({v.year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedIssueId} onValueChange={setSelectedIssueId} disabled={!selectedVolumeId}>
            <SelectTrigger className="w-48 rounded-xl bg-white">
              <SelectValue placeholder="Select issue" />
            </SelectTrigger>
            <SelectContent>
              {issuesForVolume.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  Issue {i.number}
                  {i.title ? ` — ${i.title}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="w-full text-xs text-gray-500">
          Volume and issue cannot be changed after publishing — double-check before confirming.
        </p>
        <Button
          className="rounded-xl"
          disabled={!selectedVolumeId || !selectedIssueId}
          onClick={() =>
            openConfirm({
              title: "Publish Article",
              description: "Publish this article and make it publicly available.",
              confirmLabel: "Publish",
              onConfirm: async () => {
                await mutation.mutateAsync(() =>
                  workflowApi.publish(submission.id, undefined, selectedVolumeId, selectedIssueId),
                );
                toast({ title: "Article published" });
              },
            })
          }
        >
          Publish Now
        </Button>
      </ActionPanel>,
    );
  }

  if (showScheduledPublishPanel) {
    panels.push(
      <ActionPanel key="scheduled-publish" title="Publisher / Admin — Scheduled Article">
        <p className="w-full text-sm text-gray-600">
          Scheduled for{" "}
          {submission.scheduledAt
            ? new Date(submission.scheduledAt).toLocaleDateString()
            : "a future date"}
          .
        </p>
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Publish Now",
              description: "Publish this scheduled article immediately.",
              confirmLabel: "Publish Now",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.publish(submission.id));
                toast({ title: "Article published" });
              },
            })
          }
        >
          Publish Now
        </Button>
      </ActionPanel>,
    );
  }

  if (panels.length === 0) {
    return (
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {isHandlingEditorRole && submission.status === "assigned" && !hasHandlingEditors(submission)
          ? 'Click "Accept as Handling Editor" if this manuscript is ready for you to manage.'
          : isHandlingEditorRole && hasHandlingEditors(submission) && !isMyAssignment
            ? "This submission is assigned to other handling editor(s)."
            : isEic && submission.status === "submitted"
              ? "Assign one or more handling editors to begin editorial review."
              : isEic && submission.status === "assigned"
                ? "The handling editor will pre-screen and invite reviewers."
                : isReviewerRole &&
                    myReviewerSlot?.invitationStatus === "pending" &&
                    submission.status === "assigned"
                  ? "Accept your review invitation to begin peer review."
                  : isReviewerRole &&
                      isReviewerOnSubmission(submission, user.id) &&
                      submission.status === "under_review" &&
                      myReviewerSlot?.invitationStatus === "accepted" &&
                      !myReviewerSlot.reviewSubmitted
                    ? "Your review task should appear here — try refreshing the page."
                    : isReviewerRole && isReviewerOnSubmission(submission, user.id)
                      ? "No actions available for you on this submission right now."
                      : isAuthor && submission.status === "payment_pending"
                      ? "Publication payment is due. Use the panel above or go to Payments in the sidebar."
                      : isAuthor && submission.status === "production"
                        ? "Layout is in progress. You will be asked to approve the proof when it is ready."
                        : "No actions available for your role at this stage. Another team member may need to act next."}
      </p>
    );
  }

  return (
    <>
      <div className="mb-6">{panels}</div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setPendingConfirm(null);
            setConfirmText("");
          }
        }}
      >
        <AlertDialogContent
          className={cn(
            pendingConfirm?.inviteEditors || pendingConfirm?.inviteReviewers
              ? "max-w-md gap-0 overflow-hidden rounded-2xl border-border/80 p-0 shadow-xl"
              : "rounded-xl",
          )}
        >
          {pendingConfirm?.inviteEditors ? (
            <>
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-sky-100">
                    <UserPlus className="h-5 w-5 text-sky-600" strokeWidth={1.75} />
                  </div>
                  <AlertDialogHeader className="space-y-1.5 text-left">
                    <AlertDialogTitle className="text-base font-semibold leading-snug">
                      {pendingConfirm.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm leading-relaxed">
                      {pendingConfirm.description}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
              </div>

              <div className="px-6 pb-5">
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {pendingConfirm.inviteEditors.length === 1
                    ? "Inviting"
                    : `Inviting (${pendingConfirm.inviteEditors.length})`}
                </p>
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-muted/15 p-2">
                  {pendingConfirm.inviteEditors.map((editor) => (
                    <div
                      key={editor.id}
                      className="flex items-center gap-3 rounded-lg bg-background px-3 py-2.5 shadow-sm ring-1 ring-border/40"
                    >
                      <UserAvatar
                        name={editor.name}
                        className="h-10 w-10 shrink-0"
                        fallbackClassName="text-sm font-medium"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{editor.name}</p>
                        <p className="text-xs text-muted-foreground">Handling editor</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <AlertDialogFooter className="flex-col-reverse gap-2 border-t border-border/60 bg-muted/10 px-6 py-4 sm:flex-row sm:justify-end">
                <AlertDialogCancel className="rounded-xl" disabled={confirming}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl"
                  disabled={confirming}
                  onClick={(e) => {
                    e.preventDefault();
                    void handleConfirm();
                  }}
                >
                  {confirming ? "Sending…" : pendingConfirm.confirmLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : pendingConfirm?.inviteReviewers ? (
            <>
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 ring-1 ring-violet-100">
                    <UserPlus className="h-5 w-5 text-violet-600" strokeWidth={1.75} />
                  </div>
                  <AlertDialogHeader className="space-y-1.5 text-left">
                    <AlertDialogTitle className="text-base font-semibold leading-snug">
                      {pendingConfirm.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm leading-relaxed">
                      {pendingConfirm.description}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
              </div>

              <div className="px-6 pb-5">
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {pendingConfirm.inviteReviewers.length === 1
                    ? "Inviting"
                    : `Inviting (${pendingConfirm.inviteReviewers.length})`}
                </p>
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-muted/15 p-2">
                  {pendingConfirm.inviteReviewers.map((reviewer) => (
                    <div
                      key={reviewer.id}
                      className="flex items-center gap-3 rounded-lg bg-background px-3 py-2.5 shadow-sm ring-1 ring-border/40"
                    >
                      <UserAvatar
                        name={reviewer.name}
                        className="h-10 w-10 shrink-0"
                        fallbackClassName="text-sm font-medium"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{reviewer.name}</p>
                        <p className="text-xs text-muted-foreground">Peer reviewer</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <AlertDialogFooter className="flex-col-reverse gap-2 border-t border-border/60 bg-muted/10 px-6 py-4 sm:flex-row sm:justify-end">
                <AlertDialogCancel className="rounded-xl" disabled={confirming}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl"
                  disabled={confirming}
                  onClick={(e) => {
                    e.preventDefault();
                    void handleConfirm();
                  }}
                >
                  {confirming ? "Sending…" : pendingConfirm.confirmLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{pendingConfirm?.title ?? "Confirm Action"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingConfirm?.description}
                  {pendingConfirm?.requireAcceptPhrase && (
                    <>
                      {" "}
                      Type <span className="font-semibold text-gray-900">{ACCEPT_CONFIRM_PHRASE}</span>{" "}
                      below to confirm.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {pendingConfirm?.requireAcceptPhrase && (
                <div className="space-y-2 py-2">
                  <Label htmlFor="action-confirm">Confirmation</Label>
                  <Input
                    id="action-confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`Type ${ACCEPT_CONFIRM_PHRASE} to confirm`}
                    className="rounded-xl"
                    autoComplete="off"
                  />
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl" disabled={confirming}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className={`rounded-xl ${pendingConfirm?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
                  disabled={!isConfirmValid || confirming}
                  onClick={(e) => {
                    e.preventDefault();
                    void handleConfirm();
                  }}
                >
                  {confirming ? "Processing..." : (pendingConfirm?.confirmLabel ?? "Confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
