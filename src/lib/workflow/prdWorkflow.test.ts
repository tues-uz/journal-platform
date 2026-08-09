import { describe, expect, it, beforeEach } from "vitest";
import { tokenStorage } from "@/lib/api/tokenStorage";
import { authStorage } from "@/features/auth/storage";
import { useJournalStore } from "@/lib/store/store";
import { SEED_DATA } from "@/lib/store/seed";
import { workflowApi } from "@/lib/api/workflow";
import { uploadSubmissionFiles } from "@/lib/api/files";
import { allRequiredReviewsComplete } from "@/lib/workflow/reviewers";

describe("PRD-aligned workflow", () => {
  beforeEach(() => {
    useJournalStore.setState({ ...SEED_DATA });
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
  });

  it("requires HE pre-screening before reviewer invites matter", async () => {
    const submission = useJournalStore.getState().submissions.find((s) => s.id === "sub-003");
    expect(submission?.hePrescreenComplete).toBeFalsy();
    await workflowApi.hePrescreen("sub-003", "SEND_TO_REVIEW");
    const updated = useJournalStore.getState().submissions.find((s) => s.id === "sub-003");
    expect(updated?.hePrescreenComplete).toBe(true);
  });

  it("requires two completed reviews before HE recommendation", async () => {
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

    const store = useJournalStore.getState();
    store.updateSubmission("sub-005", {
      status: "under_review",
      hePrescreenComplete: true,
      reviewers: [
        { reviewerId: "user-reviewer", invitationStatus: "accepted", reviewSubmitted: true },
        { reviewerId: "user-reviewer2", invitationStatus: "accepted", reviewSubmitted: false },
      ],
      reviewSubmitted: false,
    });

    let submission = useJournalStore.getState().submissions.find((s) => s.id === "sub-005")!;
    expect(allRequiredReviewsComplete(submission)).toBe(false);

    await workflowApi.submitReview("sub-005", "MINOR_REVISION", "Second review complete");

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
    await workflowApi.submitReview("sub-005", "MAJOR_REVISION", "Second review complete");

    submission = useJournalStore.getState().submissions.find((s) => s.id === "sub-005")!;
    expect(allRequiredReviewsComplete(submission)).toBe(true);
  });

  it("routes author revision back to the handling editor", async () => {
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

    useJournalStore.getState().updateSubmission("sub-005", { status: "revision_required" });

    const file = new File(["revised"], "revision.pdf", { type: "application/pdf" });
    await uploadSubmissionFiles("sub-005", [file], "REVISION");
    await workflowApi.submitRevision("sub-005");

    const submission = useJournalStore.getState().submissions.find((s) => s.id === "sub-005");
    expect(submission?.status).toBe("assigned");
    expect(submission?.revisionRound).toBe(1);
  });
});
