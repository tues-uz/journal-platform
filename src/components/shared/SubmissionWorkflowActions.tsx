import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/lib/rbac/usePermissions";
import {
  isAssignedHandlingEditor,
  isReadyForFinalEditorialDecision,
  needsAdminScreening,
  REVIEW_RECOMMENDATIONS,
  WORKFLOW_STAGE_LABELS,
} from "@/lib/workflow/submissionActions";
import type { Submission, SubmissionStatus } from "@/lib/store/types";
import { useToast } from "@/hooks/use-toast";
import { routes } from "@/app/routes";
import { FileUpload, type UploadedFileMeta } from "@/components/shared/FileUpload";
import { MANUSCRIPT_UPLOAD_ACCEPT, MANUSCRIPT_UPLOAD_HINT, inferPublicationFormat } from "@/lib/files/submissionFiles";
import { workflowApi } from "@/lib/api/workflow";
import { usersApi } from "@/lib/api/users";
import { uploadSubmissionFiles, type BackendPublicationFormat } from "@/lib/api/files";
import { ApiClientError } from "@/lib/api/client";

interface SubmissionWorkflowActionsProps {
  submission: Submission;
}

function ActionPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl shadow-sm border-blue-200 bg-blue-50/30 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pt-0">{children}</CardContent>
    </Card>
  );
}

const HE_RECOMMENDATION_SLUGS: Record<string, string> = {
  minor_revision: "recommend-minor-revision",
  major_revision: "recommend-major-revision",
  reject: "recommend-reject",
  accept: "recommend-accept",
};

const REVIEW_DECISION_SLUGS: Record<string, string> = {
  minor_revision: "review-minor-revision",
  major_revision: "review-major-revision",
  reject: "review-reject",
};

const ACCEPT_CONFIRM_PHRASE = "ACCEPT";

interface PendingConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  requireAcceptPhrase?: boolean;
  onConfirm: () => void | Promise<void>;
}

const filesToRaw = (files: UploadedFileMeta[]): File[] =>
  files.map((f) => f.file).filter((f): f is File => !!f);

export function SubmissionWorkflowActions({ submission }: SubmissionWorkflowActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { can, roles, isAdmin } = usePermissions({
    handlingEditorId: submission.handlingEditorId,
    submissionAuthorId: submission.authorId,
    reviewerId: submission.reviewerId,
    pendingReviewerId: submission.pendingReviewerId,
    currentUserId: user?.id,
    isAssignedReviewer: submission.reviewerId === user?.id,
  });

  const isAuthor = submission.authorId === user?.id;
  const isEic = roles.includes("editor_in_chief");
  const isHandlingEditorRole = roles.includes("handling_editor");
  const isMyAssignment = isAssignedHandlingEditor(submission.handlingEditorId, user?.id);
  const isEicOrAdmin = isEic || isAdmin;
  const isLayoutEditorRole = roles.includes("layout_editor");
  const isMyLayoutAssignment =
    isLayoutEditorRole && (!submission.layoutEditorId || submission.layoutEditorId === user?.id);

  const canAssignEditor = can("editor_assignment", "assign") || isAdmin;
  const canAssignReviewer = can("reviewer_assignment", "assign") && isMyAssignment;

  const { data: handlingEditors = [] } = useQuery({
    queryKey: ["users", "candidates", "HANDLING_EDITOR"],
    queryFn: () => usersApi.candidates("HANDLING_EDITOR"),
    enabled: canAssignEditor && submission.status === "assigned",
  });
  const { data: reviewers = [] } = useQuery({
    queryKey: ["users", "candidates", "REVIEWER"],
    queryFn: () => usersApi.candidates("REVIEWER"),
    enabled: canAssignReviewer && submission.status === "assigned",
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["submission", submission.id] });
    void queryClient.invalidateQueries({ queryKey: ["submissions"] });
  };

  const mutation = useMutation({
    mutationFn: (action: () => Promise<Submission>) => action(),
    onSuccess: () => invalidate(),
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "That action failed. Please try again.";
      toast({ title: "Action failed", description: message, variant: "destructive" });
    },
  });

  const [selectedEditor, setSelectedEditor] = useState("");
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [plagiarismScore, setPlagiarismScore] = useState(
    submission.similarityScore?.toString() ?? "",
  );
  const [plagiarismNotes, setPlagiarismNotes] = useState(submission.plagiarismNotes ?? "");
  const [revisionFiles, setRevisionFiles] = useState<UploadedFileMeta[]>([]);
  const [copyeditFiles, setCopyeditFiles] = useState<UploadedFileMeta[]>([]);
  const [copyeditNotes, setCopyeditNotes] = useState("");
  const [publicationFiles, setPublicationFiles] = useState<UploadedFileMeta[]>([]);
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

  const decisionLink = (decision: string) => routes.submissionDecision(submission.id, decision);

  const panels: React.ReactNode[] = [];

  // ── Editorial Staff: Plagiarism check ──
  if (
    can("plagiarism", "decide") &&
    needsAdminScreening(submission.status) &&
    submission.plagiarismStatus !== "passed"
  ) {
    panels.push(
      <ActionPanel key="plagiarism" title="Plagiarism Check — Record Result">
        <p className="w-full text-sm text-gray-600 mb-2">
          Run the manuscript through your similarity tool, then record the result before screening approval.
        </p>
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="Similarity %"
          value={plagiarismScore}
          onChange={(e) => setPlagiarismScore(e.target.value)}
          className="w-32 rounded-xl bg-white"
        />
        <Input
          placeholder="Notes (optional)"
          value={plagiarismNotes}
          onChange={(e) => setPlagiarismNotes(e.target.value)}
          className="w-56 rounded-xl bg-white"
        />
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Mark Plagiarism Passed",
              description: "Record that this manuscript passed the similarity check.",
              confirmLabel: "Mark Passed",
              onConfirm: async () => {
                const parsed = plagiarismScore.trim() ? Number(plagiarismScore) : undefined;
                await mutation.mutateAsync(() =>
                  workflowApi.recordPlagiarism(submission.id, "PASSED", parsed, plagiarismNotes || undefined),
                );
                toast({ title: "Plagiarism check passed" });
              },
            })
          }
        >
          Mark Passed
        </Button>
        <Button
          variant="destructive"
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Mark Plagiarism Failed",
              description: "This will fail the plagiarism check for this submission.",
              confirmLabel: "Mark Failed",
              destructive: true,
              onConfirm: async () => {
                const parsed = plagiarismScore.trim() ? Number(plagiarismScore) : undefined;
                await mutation.mutateAsync(() =>
                  workflowApi.recordPlagiarism(submission.id, "FAILED", parsed, plagiarismNotes || undefined),
                );
                toast({ title: "Plagiarism check failed" });
              },
            })
          }
        >
          Mark Failed
        </Button>
      </ActionPanel>,
    );
  }

  // ── Editorial Staff: Administrative Screening ──
  if (can("admin_screening", "decide") && needsAdminScreening(submission.status)) {
    const canApprove = submission.plagiarismStatus === "passed";
    panels.push(
      <ActionPanel key="screening" title="Administrative Screening — Your Action Required">
        {!canApprove && (
          <p className="w-full text-sm text-amber-700">
            Complete the plagiarism check before approving this submission.
          </p>
        )}
        <Button
          className="rounded-xl"
          disabled={!canApprove}
          onClick={() =>
            openConfirm({
              title: "Approve Screening",
              description: "Approve this submission and move it to editor assignment.",
              confirmLabel: "Approve",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.screen(submission.id, "APPROVE"));
                toast({ title: "Screening approved" });
              },
            })
          }
        >
          Approve
        </Button>
        <Button asChild variant="outline" className="rounded-xl bg-white">
          <Link to={decisionLink("screening-revision")}>Request Revision</Link>
        </Button>
        <Button asChild variant="destructive" className="rounded-xl">
          <Link to={decisionLink("desk-reject")}>Desk Reject</Link>
        </Button>
      </ActionPanel>,
    );
  }

  // ── EIC / Admin: Assign Handling Editor ──
  if (canAssignEditor && submission.status === "assigned" && !submission.handlingEditorId) {
    panels.push(
      <ActionPanel key="assign-editor" title="Editor Assignment — Assign Handling Editor">
        <Select value={selectedEditor} onValueChange={setSelectedEditor}>
          <SelectTrigger className="w-56 rounded-xl bg-white">
            <SelectValue placeholder="Select handling editor" />
          </SelectTrigger>
          <SelectContent>
            {handlingEditors.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="rounded-xl"
          disabled={!selectedEditor}
          onClick={() =>
            openConfirm({
              title: "Assign Handling Editor",
              description: `Assign ${handlingEditors.find((u) => u.id === selectedEditor)?.name ?? "the selected editor"} as handling editor for this submission.`,
              confirmLabel: "Assign Editor",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.assignEditor(submission.id, selectedEditor));
                toast({ title: "Handling editor assigned" });
              },
            })
          }
        >
          Assign Editor
        </Button>
      </ActionPanel>,
    );
  }

  // ── Handling Editor: Accept assignment when none assigned yet ──
  if (
    isHandlingEditorRole &&
    submission.status === "assigned" &&
    !submission.handlingEditorId
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

  // ── Handling Editor: Invite reviewer (submission stays "assigned" until the reviewer accepts) ──
  if (canAssignReviewer && submission.status === "assigned") {
    panels.push(
      <ActionPanel key="assign-reviewer" title="Reviewer Assignment — Invite Reviewer">
        <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
          <SelectTrigger className="w-56 rounded-xl bg-white">
            <SelectValue placeholder="Select reviewer" />
          </SelectTrigger>
          <SelectContent>
            {reviewers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="rounded-xl"
          disabled={!selectedReviewer}
          onClick={() =>
            openConfirm({
              title: "Invite Reviewer",
              description: `Send a review invitation to ${reviewers.find((u) => u.id === selectedReviewer)?.name ?? "the selected reviewer"}.`,
              confirmLabel: "Invite Reviewer",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.inviteReviewer(submission.id, selectedReviewer));
                toast({ title: "Reviewer invited" });
              },
            })
          }
        >
          Invite Reviewer
        </Button>
      </ActionPanel>,
    );
  }

  // ── Reviewer: Accept / decline invitation ──
  if (
    submission.pendingReviewerId === user.id &&
    submission.reviewerInvitationStatus === "pending"
  ) {
    panels.push(
      <ActionPanel key="invitation" title="Review Invitation">
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Accept Review Invitation",
              description: "You will be assigned to review this manuscript.",
              confirmLabel: "Accept Invitation",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.respondToInvitation(submission.id, true));
                toast({ title: "Review invitation accepted" });
              },
            })
          }
        >
          Accept Invitation
        </Button>
        <Button
          variant="outline"
          className="rounded-xl bg-white"
          onClick={() =>
            openConfirm({
              title: "Decline Review Invitation",
              description: "You will decline this review invitation.",
              confirmLabel: "Decline Invitation",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.respondToInvitation(submission.id, false));
                toast({ title: "Review invitation declined" });
              },
            })
          }
        >
          Decline Invitation
        </Button>
      </ActionPanel>,
    );
  }

  // ── Reviewer: Submit review ──
  if (
    can("peer_review", "decide") &&
    submission.status === "under_review" &&
    submission.reviewerId === user.id &&
    submission.reviewerInvitationStatus === "accepted" &&
    !submission.reviewSubmitted
  ) {
    panels.push(
      <ActionPanel key="review" title="Reviewer Workspace — Submit Your Review">
        {REVIEW_RECOMMENDATIONS.map((rec) => {
          const decisionSlug = REVIEW_DECISION_SLUGS[rec.value];
          if (decisionSlug) {
            return (
              <Button
                key={rec.value}
                asChild
                variant={rec.value === "reject" ? "destructive" : "outline"}
                className={`rounded-xl ${rec.value !== "reject" ? "bg-white" : ""}`}
              >
                <Link to={decisionLink(decisionSlug)}>{rec.label}</Link>
              </Button>
            );
          }

          return (
            <Button
              key={rec.value}
              className="rounded-xl"
              onClick={() =>
                openConfirm({
                  title: "Confirm Acceptance",
                  description: "You are recommending acceptance of this manuscript.",
                  confirmLabel: "Submit Accept Review",
                  requireAcceptPhrase: true,
                  onConfirm: async () => {
                    await mutation.mutateAsync(() => workflowApi.submitReview(submission.id, "ACCEPT"));
                    toast({ title: "Review submitted", description: rec.label });
                  },
                })
              }
            >
              {rec.label}
            </Button>
          );
        })}
      </ActionPanel>,
    );
  }

  // ── EIC / Admin: Final editorial decision ──
  const canFinalDecide =
    isReadyForFinalEditorialDecision(submission) &&
    isEicOrAdmin &&
    can("editorial_decision", "decide");

  if (canFinalDecide) {
    panels.push(
      <ActionPanel key="decision" title="Editorial Decision — Final Decision">
        {submission.editorRecommendation && (
          <p className="w-full text-sm text-gray-600">
            Handling editor recommendation:{" "}
            <span className="font-medium">{submission.editorRecommendation.replace(/_/g, " ")}</span>
          </p>
        )}
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Confirm Acceptance",
              description: "This manuscript will be marked as accepted for publication.",
              confirmLabel: "Confirm Acceptance",
              requireAcceptPhrase: true,
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.decide(submission.id, "ACCEPT"));
                toast({ title: "Accepted for publication" });
              },
            })
          }
        >
          Accept
        </Button>
        <Button asChild variant="outline" className="rounded-xl bg-white">
          <Link to={decisionLink("minor-revision")}>Minor Revision</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl bg-white">
          <Link to={decisionLink("major-revision")}>Major Revision</Link>
        </Button>
        <Button asChild variant="destructive" className="rounded-xl">
          <Link to={decisionLink("reject")}>Reject</Link>
        </Button>
      </ActionPanel>,
    );
  }

  // ── Handling Editor: Submit recommendation to EIC ──
  if (
    isMyAssignment &&
    isHandlingEditorRole &&
    submission.status === "under_review" &&
    can("editorial_recommendation", "decide") &&
    !submission.editorRecommendation
  ) {
    panels.push(
      <ActionPanel key="he-recommend" title="Editorial Recommendation — For Editor in Chief">
        {REVIEW_RECOMMENDATIONS.map((rec) => {
          const slug = HE_RECOMMENDATION_SLUGS[rec.value];
          if (slug && rec.value !== "accept") {
            return (
              <Button
                key={rec.value}
                asChild
                variant={rec.value === "reject" ? "destructive" : "outline"}
                className={`rounded-xl ${rec.value !== "reject" ? "bg-white" : ""}`}
              >
                <Link to={decisionLink(slug)}>{rec.label}</Link>
              </Button>
            );
          }
          return (
            <Button key={rec.value} asChild className="rounded-xl">
              <Link to={decisionLink("recommend-accept")}>{rec.label}</Link>
            </Button>
          );
        })}
      </ActionPanel>,
    );
  }

  if (
    isMyAssignment &&
    isHandlingEditorRole &&
    submission.status === "under_review" &&
    submission.editorRecommendation
  ) {
    panels.push(
      <Card key="he-recommend-done" className="rounded-xl shadow-sm border-gray-200 bg-gray-50 mb-4">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Editorial recommendation submitted:</span>{" "}
            {submission.editorRecommendation.replace(/_/g, " ")}. The Editor in Chief will make the
            final decision.
          </p>
        </CardContent>
      </Card>,
    );
  }

  // ── Handling Editor: Review revision from author ──
  if (isMyAssignment && isHandlingEditorRole && submission.status === "revision_required") {
    panels.push(
      <ActionPanel key="he-revision" title="Handling Editor — Review Author Revision">
        <Button asChild variant="outline" className="rounded-xl bg-white">
          <Link to={decisionLink("further-revision")}>Send Back to Review</Link>
        </Button>
        <Button asChild variant="destructive" className="rounded-xl">
          <Link to={decisionLink("reject-after-revision")}>Reject</Link>
        </Button>
      </ActionPanel>,
    );
  }

  // ── Author: Upload revision (handling editor reviews it next, above) ──
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
              title: "Upload Revision",
              description: "Upload your revised manuscript. Your handling editor will review it next.",
              confirmLabel: "Upload Revision",
              onConfirm: async () => {
                await mutation.mutateAsync(() =>
                  uploadSubmissionFiles(submission.id, filesToRaw(revisionFiles), "REVISION").then(() => submission),
                );
                toast({ title: "Revision uploaded", description: "Your handling editor has been notified to review it." });
                setRevisionFiles([]);
              },
            })
          }
        >
          Upload Revision
        </Button>
      </ActionPanel>,
    );
  }

  // ── Copyeditor ──
  if (can("copyediting", "decide") && submission.status === "accepted") {
    panels.push(
      <ActionPanel key="copy-start" title="Copyediting — Start Language Review">
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Start Copyediting",
              description: "Begin language review for this accepted manuscript.",
              confirmLabel: "Start Copyediting",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.startCopyediting(submission.id));
                toast({ title: "Copyediting started" });
              },
            })
          }
        >
          Start Copyediting
        </Button>
      </ActionPanel>,
    );
  }

  if (can("copyediting", "decide") && submission.status === "copyediting") {
    panels.push(
      <ActionPanel key="copy-done" title="Copyediting — Upload & Send to Production">
        <p className="w-full text-sm text-gray-600 mb-1">
          Download the source manuscript from the Files tab, then upload your copyedited version
          before sending to layout.
        </p>
        <div className="w-full">
          <FileUpload
            label="Upload copyedited manuscript"
            accept={MANUSCRIPT_UPLOAD_ACCEPT}
            hint={MANUSCRIPT_UPLOAD_HINT}
            files={copyeditFiles}
            onChange={setCopyeditFiles}
            maxFiles={1}
          />
        </div>
        <div className="w-full">
          <Label htmlFor="copyedit-notes" className="text-sm text-gray-700">
            Notes for layout editor (optional)
          </Label>
          <Textarea
            id="copyedit-notes"
            value={copyeditNotes}
            onChange={(e) => setCopyeditNotes(e.target.value)}
            placeholder="Style decisions, queries resolved, or layout guidance..."
            className="mt-1.5 rounded-xl bg-white min-h-[80px]"
          />
        </div>
        <Button
          className="rounded-xl"
          disabled={copyeditFiles.length === 0}
          onClick={() =>
            openConfirm({
              title: "Send to Production",
              description: `Upload the copyedited file "${copyeditFiles[0]?.name ?? "manuscript"}" and send this submission to the layout team.`,
              confirmLabel: "Send to Production",
              onConfirm: async () => {
                await uploadSubmissionFiles(submission.id, filesToRaw(copyeditFiles), "COPYEDIT");
                await mutation.mutateAsync(() => workflowApi.sendToProduction(submission.id, copyeditNotes.trim() || undefined));
                toast({ title: "Sent to production" });
                setCopyeditFiles([]);
                setCopyeditNotes("");
              },
            })
          }
        >
          Send to Production
        </Button>
      </ActionPanel>,
    );
  }

  // ── Layout Editor: start layout, upload publication files, send for proof ──
  if (isMyLayoutAssignment && submission.status === "production" && !submission.proofReady) {
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
                description="PDF, HTML, XML, ePub, or DOCX — each upload creates a new version"
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
              description: "Send the proof back to the layout editor for corrections.",
              confirmLabel: "Request Correction",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.respondToProof(submission.id, false));
                toast({ title: "Correction request sent to layout editor" });
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

  // ── Publisher / Admin: Publish ──
  if (
    (can("publication", "publish") || isAdmin) &&
    submission.status === "production" &&
    submission.proofApproved
  ) {
    panels.push(
      <ActionPanel key="publish" title="Publisher / Admin — Publish Article">
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Publish Article",
              description: "Publish this article and make it publicly available.",
              confirmLabel: "Publish",
              onConfirm: async () => {
                await mutation.mutateAsync(() => workflowApi.publish(submission.id));
                toast({ title: "Article published" });
              },
            })
          }
        >
          Publish
        </Button>
      </ActionPanel>,
    );
  }

  if (panels.length === 0) {
    const eicAwaitingReview =
      isEic &&
      submission.status === "under_review" &&
      !isReadyForFinalEditorialDecision(submission);

    return (
      <Card className="rounded-xl shadow-sm border-gray-200 bg-gray-50 mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Current stage:</span>{" "}
            {WORKFLOW_STAGE_LABELS[submission.status] ?? submission.status.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {eicAwaitingReview
              ? "Final accept/reject actions unlock after the reviewer submits their review or the handling editor sends a recommendation."
              : isHandlingEditorRole && submission.status === "assigned" && !submission.handlingEditorId
              ? "Click “Accept as Handling Editor” if this manuscript is ready for you to manage."
              : isHandlingEditorRole && submission.handlingEditorId && !isMyAssignment
                ? "This submission is assigned to another handling editor."
                : isEic && submission.status === "assigned"
                  ? "Assign a handling editor, then invite a reviewer."
                  : "No actions available for your role at this stage. Another team member may need to act next."}
          </p>
        </CardContent>
      </Card>
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
        <AlertDialogContent className="rounded-xl">
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
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
