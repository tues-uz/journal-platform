import { REVIEW_RECOMMENDATIONS } from "@/lib/workflow/submissionActions";
import { countSubmittedReviews, getReviewerSlots } from "@/lib/workflow/reviewers";
import type { ReviewerAssignment, Submission } from "@/lib/store/types";
import { MIN_REVIEWERS } from "@/lib/store/types";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRecommendation(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().replace(/-/g, "_");
  return REVIEW_RECOMMENDATIONS.find((rec) => rec.value === normalized)?.label ?? value;
}

const RECOMMENDATION_BADGE: Record<string, string> = {
  accept: "text-green-700",
  minor_revision: "text-sky-700",
  major_revision: "text-amber-800",
  reject: "text-red-700",
};

function ReviewerAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border/60"
      />
    );
  }

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-500 to-emerald-600"
      aria-hidden
    >
      <span className="text-xs font-semibold text-white">{getInitials(name) || "R"}</span>
    </div>
  );
}

function ReviewerReportRow({
  name,
  avatarUrl,
  slot,
  isYou,
}: {
  name: string;
  avatarUrl?: string;
  slot: ReviewerAssignment;
  isYou?: boolean;
}) {
  const recommendationKey = slot.recommendation?.toLowerCase().replace(/-/g, "_");
  const recommendationLabel = formatRecommendation(slot.recommendation);

  return (
    <div className="flex gap-3 px-4 py-4">
      <ReviewerAvatar name={name} avatarUrl={avatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {name}
            {isYou ? (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
            ) : null}
          </p>
          {slot.reviewSubmitted && recommendationLabel ? (
            <span
              className={cn(
                "text-xs font-medium",
                recommendationKey ? RECOMMENDATION_BADGE[recommendationKey] : "text-foreground",
              )}
            >
              {recommendationLabel}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Awaiting review</span>
          )}
        </div>
        {slot.reviewSubmitted && slot.comments ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {slot.comments}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface ReviewerProfile {
  name: string;
  avatarUrl?: string;
}

interface ReviewerReportsDisplayProps {
  submission: Submission;
  getReviewer: (reviewerId: string, index: number) => ReviewerProfile;
  currentUserId?: string;
}

export function ReviewerReportsDisplay({
  submission,
  getReviewer,
  currentUserId,
}: ReviewerReportsDisplayProps) {
  const slots = getReviewerSlots(submission).filter((slot) => slot.invitationStatus === "accepted");
  const submittedCount = countSubmittedReviews(submission);

  if (slots.length === 0 || submittedCount === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-border/80 bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <p className="text-sm font-medium text-foreground">Peer review reports</p>
        <p className="text-xs text-muted-foreground">
          {submittedCount} of {Math.max(slots.length, MIN_REVIEWERS)} submitted
        </p>
      </div>
      <div className="divide-y divide-border/60">
        {slots.map((slot, index) => {
          const enrichedSlot =
            slot.comments || slot.reviewerId !== submission.reviewerId
              ? slot
              : { ...slot, comments: submission.reviewComments ?? slot.comments };
          const reviewer = getReviewer(slot.reviewerId, index);

          return (
            <ReviewerReportRow
              key={slot.reviewerId}
              slot={enrichedSlot}
              name={reviewer.name}
              avatarUrl={reviewer.avatarUrl}
              isYou={!!currentUserId && slot.reviewerId === currentUserId}
            />
          );
        })}
      </div>
    </div>
  );
}
