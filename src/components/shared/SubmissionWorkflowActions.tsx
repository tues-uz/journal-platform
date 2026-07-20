import { useState } from "react";
import { Link } from "react-router-dom";
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
import { useJournalStore } from "@/lib/store/store";
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
import { buildSubmissionFilesFromUpload, MANUSCRIPT_UPLOAD_ACCEPT, MANUSCRIPT_UPLOAD_HINT } from "@/lib/files/submissionFiles";

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

export function SubmissionWorkflowActions({ submission }: SubmissionWorkflowActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const users = useJournalStore((s) => s.users);
  const updateSubmissionStatus = useJournalStore((s) => s.updateSubmissionStatus);
  const assignHandlingEditor = useJournalStore((s) => s.assignHandlingEditor);
  const assignReviewer = useJournalStore((s) => s.assignReviewer);
  const respondToReviewerInvitation = useJournalStore((s) => s.respondToReviewerInvitation);
  const recordPlagiarismCheck = useJournalStore((s) => s.recordPlagiarismCheck);
  const submitReview = useJournalStore((s) => s.submitReview);
  const updateSubmission = useJournalStore((s) => s.updateSubmission);
  const addActivity = useJournalStore((s) => s.addActivity);
  const addNotification = useJournalStore((s) => s.addNotification);

  const { can, roles, isAdmin } = usePermissions({
    handlingEditorId: submission.handlingEditorId,
    submissionAuthorId: submission.authorId,
    reviewerId: submission.reviewerId,
    pendingReviewerId: submission.pendingReviewerId,
    currentUserId: user?.id,
    isAssignedReviewer: submission.reviewerId === user?.id,
  });

  const [selectedEditor, setSelectedEditor] = useState(submission.handlingEditorId ?? "");
  const [selectedReviewer, setSelectedReviewer] = useState(submission.reviewerId ?? "");
  const [plagiarismScore, setPlagiarismScore] = useState(
    submission.similarityScore?.toString() ?? "",
  );
  const [plagiarismNotes, setPlagiarismNotes] = useState(submission.plagiarismNotes ?? "");
  const [revisionFiles, setRevisionFiles] = useState<UploadedFileMeta[]>([]);
  const [copyeditFiles, setCopyeditFiles] = useState<UploadedFileMeta[]>([]);
  const [copyeditNotes, setCopyeditNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);

  if (!user) return null;

  const act = (status: SubmissionStatus, label: string) => {
    updateSubmissionStatus(submission.id, status, user.id, user.name, label);
    toast({ title: "Workflow updated", description: label });
  };

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
    } finally {
      setConfirming(false);
    }
  };

  const isConfirmValid =
    !pendingConfirm?.requireAcceptPhrase ||
    confirmText.trim().toUpperCase() === ACCEPT_CONFIRM_PHRASE;

  const decisionLink = (decision: string) => routes.submissionDecision(submission.id, decision);

  const isAuthor = submission.authorId === user.id;
  const isEic = roles.includes("editor_in_chief");
  const isHandlingEditorRole = roles.includes("handling_editor");
  const isMyAssignment = isAssignedHandlingEditor(submission.handlingEditorId, user.id);
  const isEicOrAdmin = isEic || isAdmin;

  const handlingEditors = users.filter(
    (u) => u.status === "active" && u.roles.includes("handling_editor"),
  );
  const reviewers = users.filter(
    (u) => u.status === "active" && u.roles.includes("reviewer"),
  );

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
              onConfirm: () => {
                const parsed = plagiarismScore.trim() ? Number(plagiarismScore) : undefined;
                recordPlagiarismCheck(submission.id, user.id, user.name, {
                  status: "passed",
                  similarityScore: parsed,
                  notes: plagiarismNotes,
                });
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
              onConfirm: () => {
                recordPlagiarismCheck(submission.id, user.id, user.name, {
                  status: "failed",
                  similarityScore: plagiarismScore.trim() ? Number(plagiarismScore) : undefined,
                  notes: plagiarismNotes,
                });
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
              onConfirm: () => act("assigned", "Approved administrative screening"),
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
  if ((can("editor_assignment", "assign") || isAdmin) && submission.status === "assigned") {
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
              onConfirm: () => {
                assignHandlingEditor(submission.id, selectedEditor, user.id, user.name);
                toast({ title: "Handling editor assigned" });
              },
            })
          }
        >
          Assign Editor
        </Button>
        {submission.handlingEditorId && (
          <Button
            variant="outline"
            className="rounded-xl bg-white"
            onClick={() =>
              openConfirm({
                title: "Send to Peer Review",
                description: "Send this manuscript to peer review.",
                confirmLabel: "Send to Peer Review",
                onConfirm: () => act("under_review", "Sent to peer review"),
              })
            }
          >
            Send to Peer Review
          </Button>
        )}
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
              onConfirm: () => {
                assignHandlingEditor(submission.id, user.id, user.id, user.name);
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

  // ── Handling Editor: Start review when assigned to them ──
  if (can("reviewer_assignment", "assign") && isMyAssignment && submission.status === "assigned") {
    panels.push(
      <ActionPanel key="he-start" title="Handling Editor — Begin Editorial Process">
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Start Peer Review",
              description: "Begin the editorial and peer review process for this submission.",
              confirmLabel: "Start Peer Review",
              onConfirm: () => act("under_review", "Editorial review started"),
            })
          }
        >
          Start Peer Review
        </Button>
      </ActionPanel>,
    );
  }

  if (can("reviewer_assignment", "assign") && isMyAssignment && submission.status === "under_review") {
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
              onConfirm: () => {
                assignReviewer(submission.id, selectedReviewer, user.id, user.name);
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
              onConfirm: () => {
                respondToReviewerInvitation(submission.id, user.id, true);
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
              onConfirm: () => {
                respondToReviewerInvitation(submission.id, user.id, false);
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
                  onConfirm: () => {
                    submitReview(submission.id, rec.value, user.id, user.name);
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
              onConfirm: () => act("accepted", "Accepted for publication"),
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
        <Button
          className="rounded-xl"
          onClick={() =>
            openConfirm({
              title: "Accept Author Revision",
              description: "Accept the author's revision and return this submission to review.",
              confirmLabel: "Accept Revision",
              onConfirm: () => act("under_review", "Revision accepted, back to review"),
            })
          }
        >
          Accept Revision
        </Button>
        <Button asChild variant="outline" className="rounded-xl bg-white">
          <Link to={decisionLink("further-revision")}>Request Further Revision</Link>
        </Button>
        <Button asChild variant="destructive" className="rounded-xl">
          <Link to={decisionLink("reject-after-revision")}>Reject</Link>
        </Button>
      </ActionPanel>,
    );
  }

  // ── Author: Submit revision with files ──
  if (isAuthor && can("revision", "create") && submission.status === "revision_required") {
    panels.push(
      <ActionPanel key="revision" title="Author — Submit Revision">
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
              description: "Upload your revised manuscript and return it to editorial review.",
              confirmLabel: "Submit Revision",
              onConfirm: async () => {
                const uploaded = await buildSubmissionFilesFromUpload(
                  revisionFiles,
                  "revision",
                  `file-rev-${submission.id}`,
                );
                updateSubmission(submission.id, {
                  files: [...submission.files.filter((f) => f.type !== "revision"), ...uploaded],
                });
                act("under_review", "Revision submitted by author");
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
              onConfirm: () => act("copyediting", "Copyediting started"),
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
                const uploaded = await buildSubmissionFilesFromUpload(
                  copyeditFiles,
                  "copyedit",
                  `file-copyedit-${submission.id}`,
                );
                const now = new Date().toISOString();
                const trimmedNotes = copyeditNotes.trim();
                updateSubmission(submission.id, {
                  files: [...submission.files.filter((f) => f.type !== "copyedit"), ...uploaded],
                  copyeditorId: user.id,
                  copyeditedAt: now,
                  copyeditNotes: trimmedNotes || undefined,
                });
                act(
                  "production",
                  trimmedNotes
                    ? `Copyedited manuscript uploaded. Notes: ${trimmedNotes}`
                    : "Copyedited manuscript uploaded and sent to production",
                );
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

  // Layout editor workflow is handled in LayoutEditorWorkspace on the submission detail page.

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
              onConfirm: () => {
                const now = new Date().toISOString();
                updateSubmission(submission.id, { proofApproved: true });
                addActivity({
                  submissionId: submission.id,
                  action: "Author approved proof",
                  actorId: user.id,
                  actorName: user.name,
                  actorRoles: user.roles,
                  statusAfter: "production",
                  timestamp: now,
                  details: "Manuscript proof approved for publication",
                });
                users
                  .filter((u) => u.status === "active" && u.roles.includes("publisher_admin"))
                  .forEach((admin) => {
                    addNotification({
                      userId: admin.id,
                      title: "Proof Approved",
                      message: `${submission.submissionNumber} is ready to publish.`,
                      read: false,
                      createdAt: now,
                      link: routes.submissionById(submission.id),
                    });
                  });
                if (submission.handlingEditorId) {
                  addNotification({
                    userId: submission.handlingEditorId,
                    title: "Proof Approved",
                    message: `${submission.submissionNumber} layout proof was approved by the author.`,
                    read: false,
                    createdAt: now,
                    link: routes.submissionById(submission.id),
                  });
                }
                toast({
                  title: "Proof approved",
                  description: "The publisher will finalize publication.",
                });
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
              onConfirm: () => {
                const now = new Date().toISOString();
                updateSubmission(submission.id, { proofReady: false, proofApproved: false });
                addActivity({
                  submissionId: submission.id,
                  action: "Author requested layout correction",
                  actorId: user.id,
                  actorName: user.name,
                  actorRoles: user.roles,
                  statusAfter: "production",
                  timestamp: now,
                  details: "Proof sent back to layout editor for corrections",
                });
                if (submission.layoutEditorId) {
                  addNotification({
                    userId: submission.layoutEditorId,
                    title: "Layout Correction Requested",
                    message: `${submission.submissionNumber} requires layout corrections after author proof review.`,
                    read: false,
                    createdAt: now,
                    link: routes.submissionById(submission.id),
                  });
                }
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
              onConfirm: () => act("published", "Article published"),
            })
          }
        >
          Publish
        </Button>
      </ActionPanel>,
    );
  }

  if ((can("publication", "publish") || isAdmin) && submission.status === "accepted") {
    panels.push(
      <ActionPanel key="publish-fast" title="Publisher / Admin — Fast Track Publish">
        <Button
          variant="outline"
          className="rounded-xl bg-white"
          onClick={() =>
            openConfirm({
              title: "Fast Track Publish",
              description: "Publish this accepted article immediately, skipping remaining production steps.",
              confirmLabel: "Publish Now",
              onConfirm: () => act("published", "Article published (fast track)"),
            })
          }
        >
          Publish Now
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
                  ? "Assign a handling editor, then send the manuscript to peer review before a final decision."
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
