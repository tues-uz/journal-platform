import { beforeEach, describe, expect, it } from "vitest";
import { authStorage } from "@/features/auth/storage";
import { tokenStorage } from "@/lib/api/tokenStorage";
import { submissionsApi } from "@/lib/api/submissions";
import { workflowApi } from "@/lib/api/workflow";
import { canAnyRole } from "@/lib/rbac/can";
import { SEED_DATA } from "@/lib/store/seed";
import { useJournalStore } from "@/lib/store/store";
import { getHandlingEditorIds } from "@/lib/workflow/handlingEditors";
import { allRequiredReviewsComplete } from "@/lib/workflow/reviewers";
import {
  hasAuthorRevisionAwaitingHeReview,
  isAssignedHandlingEditor,
  isReadyForFinalEditorialDecision,
} from "@/lib/workflow/submissionActions";

describe("HE editorial decision after reviewer revision/reject", () => {
  beforeEach(() => {
    useJournalStore.setState({ ...SEED_DATA });
  });

  it("shows decision readiness after both reviewers submit unhappy recommendations", async () => {
    const subId = "sub-004";

    tokenStorage.save({
      accessToken: "demo-access-user-he",
      refreshToken: "demo-refresh-user-he",
    });
    authStorage.save({
      id: "user-he",
      name: "Dr. Handling Editor",
      email: "editor@journal.com",
      roles: ["handling_editor"],
    });

    await workflowApi.hePrescreen(subId, "SEND_TO_REVIEW");
    await workflowApi.inviteReviewer(subId, "user-reviewer");
    await workflowApi.inviteReviewer(subId, "user-reviewer2");

    tokenStorage.save({
      accessToken: "demo-access-user-reviewer",
      refreshToken: "demo-refresh-user-reviewer",
    });
    authStorage.save({
      id: "user-reviewer",
      name: "Dr. Peer Reviewer",
      email: "reviewer@journal.com",
      roles: ["reviewer"],
    });
    await workflowApi.respondToInvitation(subId, true);

    tokenStorage.save({
      accessToken: "demo-access-user-reviewer2",
      refreshToken: "demo-refresh-user-reviewer2",
    });
    authStorage.save({
      id: "user-reviewer2",
      name: "Dr. Second Reviewer",
      email: "reviewer2@journal.com",
      roles: ["reviewer"],
    });
    await workflowApi.respondToInvitation(subId, true);

    tokenStorage.save({
      accessToken: "demo-access-user-reviewer",
      refreshToken: "demo-refresh-user-reviewer",
    });
    authStorage.save({
      id: "user-reviewer",
      name: "Dr. Peer Reviewer",
      email: "reviewer@journal.com",
      roles: ["reviewer"],
    });
    await workflowApi.submitReview(subId, "MINOR_REVISION", "Needs minor fixes");

    tokenStorage.save({
      accessToken: "demo-access-user-reviewer2",
      refreshToken: "demo-refresh-user-reviewer2",
    });
    authStorage.save({
      id: "user-reviewer2",
      name: "Dr. Second Reviewer",
      email: "reviewer2@journal.com",
      roles: ["reviewer"],
    });
    await workflowApi.submitReview(subId, "REJECT", "Should reject");

    const submission = await submissionsApi.get(subId);

    expect(submission.status).toBe("under_review");
    expect(allRequiredReviewsComplete(submission)).toBe(true);
    expect(isReadyForFinalEditorialDecision(submission)).toBe(true);
    expect(isAssignedHandlingEditor(submission, "user-he")).toBe(true);
    expect(
      canAnyRole(["handling_editor"], "editorial_decision", "decide", {
        handlingEditorId: submission.handlingEditorId,
        handlingEditorIds: getHandlingEditorIds(submission),
        currentUserId: "user-he",
      }),
    ).toBe(true);
  });

  it("allows HE to decide after author submits a revision", async () => {
    tokenStorage.save({
      accessToken: "demo-access-user-author",
      refreshToken: "demo-refresh-user-author",
    });
    authStorage.save({
      id: "user-author",
      name: "Dr. Jane Author",
      email: "author@journal.com",
      roles: ["author"],
    });

    useJournalStore.getState().updateSubmission("sub-004", { status: "revision_required" });
    await workflowApi.submitRevision("sub-004");

    tokenStorage.save({
      accessToken: "demo-access-user-he",
      refreshToken: "demo-refresh-user-he",
    });
    authStorage.save({
      id: "user-he",
      name: "Dr. Handling Editor",
      email: "editor@journal.com",
      roles: ["handling_editor"],
    });

    const submission = await submissionsApi.get("sub-004");
    expect(submission.status).toBe("assigned");
    expect(submission.revisionRound).toBe(1);
    expect(hasAuthorRevisionAwaitingHeReview(submission)).toBe(true);
    expect(isAssignedHandlingEditor(submission, "user-he")).toBe(true);
    expect(
      canAnyRole(["handling_editor"], "editorial_decision", "decide", {
        handlingEditorId: submission.handlingEditorId,
        handlingEditorIds: getHandlingEditorIds(submission),
        currentUserId: "user-he",
      }),
    ).toBe(true);
  });
});
