import { describe, expect, it } from "vitest";
import { mapSubmissionDto } from "@/lib/api/submissions";
import { submissionToDto } from "@/lib/demo/mappers";
import { canAnyRole } from "@/lib/rbac/can";
import { buildSubmissionScope } from "@/lib/rbac/submissionAccess";
import { getReviewerSlot } from "@/lib/workflow/reviewers";
import type { Submission } from "@/lib/store/types";

const dualReviewerSubmission: Submission = {
  id: "sub-test",
  submissionNumber: "SJMS-2026-012",
  title: "Test manuscript",
  abstract: "Abstract",
  keywords: [],
  language: "English",
  articleType: "Research Article",
  status: "under_review",
  authorId: "user-author",
  authors: [],
  handlingEditorId: "user-he",
  hePrescreenComplete: true,
  reviewerId: "user-reviewer",
  reviewerInvitationStatus: "accepted",
  reviewSubmitted: false,
  reviewComments: "Ok good",
  reviewers: [
    {
      reviewerId: "user-reviewer",
      invitationStatus: "accepted",
      reviewSubmitted: true,
      comments: "Ok good",
    },
    {
      reviewerId: "user-reviewer2",
      invitationStatus: "accepted",
      reviewSubmitted: false,
    },
  ],
  files: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

describe("multi-reviewer access", () => {
  it("keeps reviewer 2 peer-review access after API DTO round trip", () => {
    const dto = submissionToDto(dualReviewerSubmission);
    const mapped = mapSubmissionDto(dto);
    const slot = getReviewerSlot(mapped, "user-reviewer2");

    expect(slot?.invitationStatus).toBe("accepted");
    expect(slot?.reviewSubmitted).toBe(false);

    const scope = buildSubmissionScope(mapped, "user-reviewer2");
    expect(canAnyRole(["reviewer"], "peer_review", "decide", { ...scope, currentUserId: "user-reviewer2" })).toBe(
      true,
    );
  });

  it("reconstructs reviewer slots from legacy fields when reviewers array is missing", () => {
    const legacyOnly: Submission = {
      ...dualReviewerSubmission,
      reviewers: undefined,
      pendingReviewerId: "user-reviewer2",
      reviewerInvitationStatus: "pending",
    };

    const dto = submissionToDto(legacyOnly);
    expect(dto.reviewers?.length).toBeGreaterThanOrEqual(2);

    const mapped = mapSubmissionDto({ ...dto, reviewers: null });
    const slot = getReviewerSlot(mapped, "user-reviewer2");
    expect(slot?.invitationStatus).toBe("pending");

    const scope = buildSubmissionScope(mapped, "user-reviewer2");
    expect(
      canAnyRole(["reviewer"], "reviewer_invitation", "decide", {
        ...scope,
        currentUserId: "user-reviewer2",
      }),
    ).toBe(true);
  });

  it("keeps reviewer 2 active when only legacy reviewerId is returned without reviewers array", () => {
    const mapped = mapSubmissionDto({
      ...submissionToDto(dualReviewerSubmission),
      reviewers: null,
      pendingReviewerId: null,
      reviewerInvitationStatus: "ACCEPTED",
    });

    expect(getReviewerSlot(mapped, "user-reviewer2")).toBeUndefined();

    const scope = buildSubmissionScope(mapped, "user-reviewer");
    expect(
      canAnyRole(["reviewer"], "peer_review", "decide", {
        ...scope,
        currentUserId: "user-reviewer",
      }),
    ).toBe(true);
  });
});
