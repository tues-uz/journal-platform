import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PublicationFilesPanel } from "@/components/layout-editor/PublicationFilesPanel";
import { LayoutStatusBadge } from "@/components/shared/LayoutStatusBadge";
import { getPublicationFiles } from "@/lib/files/submissionFiles";
import type { Role } from "@/lib/rbac/types";
import type { Submission } from "@/lib/store/types";
import { workflowApi } from "@/lib/api/workflow";
import { ApiClientError } from "@/lib/api/client";
import {
  createDefaultLayoutChecklist,
  deriveLayoutPhase,
  LAYOUT_CHECKLIST_ITEMS,
} from "@/lib/workflow/layoutPhase";
import { useToast } from "@/hooks/use-toast";

interface LayoutWorkspaceUser {
  id: string;
  name: string;
  roles: Role[];
}

interface LayoutEditorWorkspaceProps {
  submission: Submission;
  user: LayoutWorkspaceUser;
  getUserById: (id: string) => LayoutWorkspaceUser | undefined;
  journalName: string;
  issueLabel?: string;
  volumeLabel?: string;
  readOnly?: boolean;
}

export function LayoutEditorWorkspace({
  submission,
  user,
  getUserById,
  journalName,
  issueLabel,
  volumeLabel,
  readOnly = false,
}: LayoutEditorWorkspaceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const phase = deriveLayoutPhase(submission);
  const publicationFiles = getPublicationFiles(submission.files);

  const [notes, setNotes] = useState(submission.productionNotes ?? "");
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    submission.layoutChecklist ?? createDefaultLayoutChecklist(),
  );
  const [notesDirty, setNotesDirty] = useState(false);
  const [checklistDirty, setChecklistDirty] = useState(false);

  useEffect(() => {
    setNotes(submission.productionNotes ?? "");
    setChecklist(submission.layoutChecklist ?? createDefaultLayoutChecklist());
    setNotesDirty(false);
    setChecklistDirty(false);
  }, [submission.id, submission.productionNotes, submission.layoutChecklist]);

  const authorNames = useMemo(
    () => submission.authors.map((a) => a.name).join(", "),
    [submission.authors],
  );

  const isClaimedByMe =
    !submission.layoutEditorId || submission.layoutEditorId === user.id;
  const canStart =
    isClaimedByMe && !readOnly && phase === "waiting" && !submission.layoutStartedAt;
  const canWork = isClaimedByMe && !readOnly && phase === "in_progress";
  const canSendForProof = canWork && publicationFiles.length > 0;

  const startLayoutMutation = useMutation({
    mutationFn: () => workflowApi.startLayout(submission.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["submission", submission.id] });
      void queryClient.invalidateQueries({ queryKey: ["submissions"] });
      void queryClient.invalidateQueries({ queryKey: ["submission-activities", submission.id] });
      toast({ title: "Layout editing started" });
    },
    onError: (err) => {
      const msg = err instanceof ApiClientError ? err.message : "Failed to start layout.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    },
  });

  const sendForProofMutation = useMutation({
    mutationFn: () => workflowApi.sendForProof(submission.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["submission", submission.id] });
      void queryClient.invalidateQueries({ queryKey: ["submissions"] });
      void queryClient.invalidateQueries({ queryKey: ["submission-activities", submission.id] });
      toast({ title: "Marked ready for proofreading" });
    },
    onError: (err) => {
      const msg = err instanceof ApiClientError ? err.message : "Failed to send for proofreading.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    },
  });

  const handleStartLayout = () => {
    startLayoutMutation.mutate();
  };

  const handleSaveDraft = () => {
    setNotesDirty(false);
    setChecklistDirty(false);
    toast({ title: "Draft saved" });
  };

  const handleSendForProof = () => {
    if (publicationFiles.length === 0) {
      toast({
        title: "Upload required",
        description: "Upload at least one publication file before sending for proofreading.",
        variant: "destructive",
      });
      return;
    }
    sendForProofMutation.mutate();
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{submission.submissionNumber}</p>
          <h2 className="text-xl font-semibold text-gray-900">{submission.title}</h2>
        </div>
        <LayoutStatusBadge submission={submission} />
      </div>

      <Card className="rounded-2xl border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Article Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-gray-500">Authors</p>
            <p className="font-medium text-gray-900">{authorNames}</p>
          </div>
          <div>
            <p className="text-gray-500">Journal</p>
            <p className="font-medium text-gray-900">{journalName}</p>
          </div>
          <div>
            <p className="text-gray-500">Volume</p>
            <p className="font-medium text-gray-900">{volumeLabel ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Issue</p>
            <p className="font-medium text-gray-900">{issueLabel ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">DOI</p>
            <p className="font-medium text-gray-900">{submission.doi ?? "—"}</p>
          </div>
          {submission.copyeditNotes && (
            <div className="sm:col-span-2">
              <p className="text-gray-500">Copyeditor notes</p>
              <p className="text-gray-800">{submission.copyeditNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <PublicationFilesPanel
        submission={submission}
        readOnly={!canWork}
        actorId={user.id}
        actorName={user.name}
        getUserById={getUserById}
      />

      <Card className="rounded-2xl border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Production Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesDirty(true);
            }}
            disabled={!canWork}
            placeholder="Updated page numbering, replaced Figure 2, optimized image quality…"
            className="min-h-[120px] rounded-xl"
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Layout Checklist</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {LAYOUT_CHECKLIST_ITEMS.map((item) => (
            <label key={item.id} className="flex items-start gap-3 text-sm text-gray-700">
              <Checkbox
                checked={checklist[item.id] ?? false}
                disabled={!canWork}
                onCheckedChange={(checked) => {
                  setChecklist((prev) => ({ ...prev, [item.id]: checked === true }));
                  setChecklistDirty(true);
                }}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {(canStart || canWork || phase === "ready_for_proofreading" || phase === "completed") &&
        isClaimedByMe &&
        !readOnly && (
        <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          {canStart && (
            <Button
              className="rounded-xl"
              disabled={startLayoutMutation.isPending}
              onClick={handleStartLayout}
            >
              {startLayoutMutation.isPending ? "Starting…" : "Start Layout"}
            </Button>
          )}
          {canWork && (
            <>
              <Button variant="outline" className="rounded-xl bg-white" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                className="rounded-xl"
                disabled={!canSendForProof || sendForProofMutation.isPending}
                onClick={handleSendForProof}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {sendForProofMutation.isPending ? "Submitting…" : "Mark Ready for Proofreading"}
              </Button>
            </>
          )}
          {phase === "ready_for_proofreading" && (
            <p className="flex items-center text-sm text-amber-700">
              Awaiting author proofreading approval.
            </p>
          )}
          {phase === "completed" && (
            <p className="flex items-center text-sm text-emerald-700">
              Layout completed — awaiting publication.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
