import { useEffect, useMemo, useState } from "react";
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
import { useJournalStore } from "@/lib/store/store";
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
  const startLayout = useJournalStore((s) => s.startLayout);
  const sendForProof = useJournalStore((s) => s.sendForProof);
  const saveProductionNotes = useJournalStore((s) => s.saveProductionNotes);
  const updateLayoutChecklist = useJournalStore((s) => s.updateLayoutChecklist);

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
  const canSendForProof =
    canWork && publicationFiles.length > 0;

  const handleStartLayout = () => {
    if (startLayout(submission.id, user.id, user.name)) {
      toast({ title: "Layout editing started" });
    }
  };

  const handleSaveDraft = () => {
    if (notesDirty) {
      saveProductionNotes(submission.id, notes, user.id, user.name);
      setNotesDirty(false);
    }
    if (checklistDirty) {
      updateLayoutChecklist(submission.id, checklist, user.id, user.name);
      setChecklistDirty(false);
    }
    toast({ title: "Draft saved" });
  };

  const handleSendForProof = () => {
    if (notesDirty) {
      saveProductionNotes(submission.id, notes, user.id, user.name);
      setNotesDirty(false);
    }
    if (checklistDirty) {
      updateLayoutChecklist(submission.id, checklist, user.id, user.name);
      setChecklistDirty(false);
    }
    if (sendForProof(submission.id, user.id, user.name)) {
      toast({ title: "Marked ready for proofreading" });
    } else {
      toast({
        title: "Upload required",
        description: "Upload at least one publication file before sending for proofreading.",
        variant: "destructive",
      });
    }
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
            <Button className="rounded-xl" onClick={handleStartLayout}>
              Start Layout
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
                disabled={!canSendForProof}
                onClick={handleSendForProof}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Ready for Proofreading
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
