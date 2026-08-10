import { describe, expect, it } from "vitest";
import { canPerformDecision, canViewSubmission } from "@/lib/rbac/submissionAccess";
import type { Submission } from "@/lib/store/types";

const baseSubmission: Submission = {
  id: "sub-test",
  submissionNumber: "SJMS-TEST",
  title: "Test",
  abstract: "Test abstract",
  keywords: [],
  language: "English",
  articleType: "Research Article",
  status: "under_review",
  authorId: "user-author",
  authors: [],
  handlingEditorId: "user-he",
  reviewers: [
    {
      reviewerId: "user-reviewer",
      invitationStatus: "accepted",
      reviewSubmitted: true,
    },
    {
      reviewerId: "user-reviewer2",
      invitationStatus: "accepted",
      reviewSubmitted: true,
    },
  ],
  files: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

describe("submissionAccess", () => {
  it("allows production editors to view accepted submissions", () => {
    const submission = { ...baseSubmission, status: "accepted" as const };
    expect(canViewSubmission(submission, ["production_editor"], "user-production")).toBe(true);
  });

  it("allows production editors to view production submissions", () => {
    const submission = { ...baseSubmission, status: "production" as const };
    expect(canViewSubmission(submission, ["production_editor"], "user-production")).toBe(true);
  });

  it("blocks EIC final decisions until review or HE recommendation", () => {
    const submission = { ...baseSubmission, reviewSubmitted: false, editorRecommendation: undefined };
    expect(
      canPerformDecision(submission, "minor-revision", ["editor_in_chief"], "user-eic"),
    ).toBe(false);
  });

  it("blocks EIC final decisions after review is submitted", () => {
    expect(
      canPerformDecision(baseSubmission, "minor-revision", ["editor_in_chief"], "user-eic"),
    ).toBe(false);
  });

  it("allows handling editor decisions after review is submitted", () => {
    expect(
      canPerformDecision(baseSubmission, "minor-revision", ["handling_editor"], "user-he"),
    ).toBe(true);
  });

  it("allows assigned handling editor to view production submission", () => {
    const submission = {
      ...baseSubmission,
      status: "production" as const,
      handlingEditorIds: ["user-he"],
    };
    expect(canViewSubmission(submission, ["handling_editor"], "user-he")).toBe(true);
  });

  it("allows production editor to view unassigned production submission", () => {
    const submission = {
      ...baseSubmission,
      status: "production" as const,
    };
    expect(canViewSubmission(submission, ["production_editor"], "user-production")).toBe(true);
  });

  it("blocks production editor from viewing submission assigned to another editor", () => {
    const submission = {
      ...baseSubmission,
      status: "production" as const,
      layoutEditorId: "user-production-other",
    };
    expect(canViewSubmission(submission, ["production_editor"], "user-production")).toBe(false);
  });
});
