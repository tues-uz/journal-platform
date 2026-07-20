import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Submission, SubmissionFile } from "@/lib/store/types";

function FeedbackImages({ files }: { files: SubmissionFile[] }) {
  const images = files.filter((f) => f.dataUrl);
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {images.map((file) => (
        <figure key={file.id} className="rounded-xl overflow-hidden border bg-white">
          <img src={file.dataUrl} alt={file.name} className="w-full h-32 object-cover" />
          <figcaption className="px-2 py-1 text-xs text-gray-500 truncate">{file.name}</figcaption>
        </figure>
      ))}
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
  const reviewFiles = submission.files.filter(
    (f) => f.type === "decision_feedback" && f.feedbackKind === "review",
  );

  const showDecision =
    (submission.status === "revision_required" || submission.status === "rejected") &&
    (submission.decisionReason || decisionFiles.length > 0);

  if (!showDecision && !submission.reviewComments && reviewFiles.length === 0) return null;

  return (
    <>
      {showDecision && (
        <Card
          className={`rounded-xl shadow-sm mb-6 ${
            submission.status === "rejected"
              ? "border-red-200 bg-red-50/50"
              : "border-amber-200 bg-amber-50/50"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {submission.status === "rejected" ? "Rejection Feedback" : "Revision Request"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.decisionReason && (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.decisionReason}</p>
            )}
            <FeedbackImages files={decisionFiles} />
          </CardContent>
        </Card>
      )}

      {(submission.reviewComments || reviewFiles.length > 0) && (
        <Card className="rounded-xl shadow-sm border-purple-200 bg-purple-50/50 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reviewer Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.reviewComments && (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.reviewComments}</p>
            )}
            <FeedbackImages files={reviewFiles} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
