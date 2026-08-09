import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { UploadedFileMeta } from "@/components/shared/FileUpload";
import { SUBMISSION_UPLOAD_SLOTS } from "@/lib/files/submissionUploadSlots";
import type { SubmissionUploadSlot, SubmissionUploadSlotId } from "@/lib/files/submissionUploadSlots";
import { capitalizeFirstLetter } from "@/lib/utils";

interface SubmissionReviewStepProps {
  title: string;
  abstract: string;
  keywords: string;
  articleType: string;
  authorName: string;
  authorEmail: string;
  authorInstitution: string;
  orcid: string;
  uploadFiles: Record<SubmissionUploadSlotId, UploadedFileMeta[]>;
  onEditArticle: () => void;
  onEditAuthor: () => void;
  onEditFiles: () => void;
}

function EditLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      {label}
    </button>
  );
}

function ReviewPanel({
  heading,
  editLabel,
  onEdit,
  children,
}: {
  heading: string;
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border/80 bg-card">
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-2.5">
        <h3 className="text-xs font-medium text-muted-foreground">{heading}</h3>
        <EditLink onClick={onEdit} label={editLabel} />
      </div>
      {children}
    </section>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ReviewFileRow({ slot, file }: { slot: SubmissionUploadSlot; file: UploadedFileMeta }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/40">
        <Check className="h-4 w-4 text-foreground" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{slot.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {file.name} · {formatSize(file.size)}
        </p>
      </div>
    </div>
  );
}

export function SubmissionReviewStep({
  title,
  abstract,
  keywords,
  articleType,
  authorName,
  authorEmail,
  authorInstitution,
  orcid,
  uploadFiles,
  onEditArticle,
  onEditAuthor,
  onEditFiles,
}: SubmissionReviewStepProps) {
  const uploadedSlots = SUBMISSION_UPLOAD_SLOTS.filter(
    (slot) => (uploadFiles[slot.id]?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-4">
      <ReviewPanel heading="Article" editLabel="Edit article" onEdit={onEditArticle}>
        <div className="space-y-4 px-4 py-4">
          <div>
            <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
              {capitalizeFirstLetter(title)}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {articleType}
              {keywords.trim() ? ` · ${keywords.trim()}` : ""}
            </p>
          </div>
          <div className="border-t border-border/60 pt-4">
            <p className="text-xs font-medium text-muted-foreground">Abstract</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {abstract}
            </p>
          </div>
        </div>
      </ReviewPanel>

      <ReviewPanel heading="Author" editLabel="Edit author" onEdit={onEditAuthor}>
        <div className="space-y-1 px-4 py-4 text-sm">
          <p className="font-medium text-foreground">{authorName}</p>
          {authorInstitution ? (
            <p className="text-muted-foreground">{authorInstitution}</p>
          ) : null}
          <p className="text-muted-foreground">
            {authorEmail}
            <span className="px-1.5 text-muted-foreground/35">·</span>
            <span className="font-mono text-xs text-foreground/80">{orcid}</span>
          </p>
        </div>
      </ReviewPanel>

      <ReviewPanel heading="Files" editLabel="Edit files" onEdit={onEditFiles}>
        {uploadedSlots.length > 0 ? (
          <div className="divide-y divide-border/80">
            {uploadedSlots.map((slot) => {
              const file = uploadFiles[slot.id][0];
              if (!file) return null;
              return <ReviewFileRow key={slot.id} slot={slot} file={file} />;
            })}
          </div>
        ) : (
          <p className="px-4 py-4 text-sm text-muted-foreground">No files uploaded.</p>
        )}
      </ReviewPanel>
    </div>
  );
}
