import type { Submission, SubmissionFile } from "@/lib/store/types";
import { cn } from "@/lib/utils";

function FeedbackImages({ files }: { files: SubmissionFile[] }) {
  const images = files.filter((f) => f.dataUrl);
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((file) => (
        <figure key={file.id} className="overflow-hidden rounded-md border border-border/80 bg-muted/20">
          <img src={file.dataUrl} alt={file.name} className="h-28 w-full object-cover" />
          <figcaption className="truncate px-2 py-1.5 text-xs text-muted-foreground">
            {file.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function FeedbackBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 overflow-hidden rounded-lg border border-border/80 bg-card", className)}>
      <div className="border-b border-border/60 px-4 py-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
      </div>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </div>
  );
}

interface DecisionFeedbackDisplayProps {
  submission: Submission;
}

export function DecisionFeedbackDisplay({ submission }: DecisionFeedbackDisplayProps) {
  const decisionFiles = submission.files.filter(
    (f) => f.type === "decision_feedback" && f.feedbackKind === "decision",
  );

  const showDecision =
    (submission.status === "revision_required" || submission.status === "rejected") &&
    (submission.decisionReason || decisionFiles.length > 0);

  if (!showDecision) return null;

  return (
    <>
      {showDecision && (
        <FeedbackBlock
          title={submission.status === "rejected" ? "Rejection feedback" : "Revision request"}
        >
          {submission.decisionReason ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {submission.decisionReason}
            </p>
          ) : null}
          <FeedbackImages files={decisionFiles} />
        </FeedbackBlock>
      )}
    </>
  );
}
