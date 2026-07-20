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
  reviewerId: "user-reviewer",
  reviewerInvitationStatus: "accepted",
  reviewSubmitted: true,
  files: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

describe("submissionAccess", () => {
  it("allows copyeditors to view accepted submissions", () => {
    const submission = { ...baseSubmission, status: "accepted" as const };
    expect(canViewSubmission(submission, ["copyeditor"], "user-copy")).toBe(true);
  });

  it("allows copyeditors to view copyediting submissions", () => {
    const submission = { ...baseSubmission, status: "copyediting" as const };
    expect(canViewSubmission(submission, ["copyeditor"], "user-copy")).toBe(true);
  });

  it("blocks EIC final decisions until review or HE recommendation", () => {
    const submission = { ...baseSubmission, reviewSubmitted: false, editorRecommendation: undefined };
    expect(
      canPerformDecision(submission, "minor-revision", ["editor_in_chief"], "user-eic"),
    ).toBe(false);
  });

  it("allows EIC final decisions after review is submitted", () => {
    expect(
      canPerformDecision(baseSubmission, "minor-revision", ["editor_in_chief"], "user-eic"),
    ).toBe(true);
  });

  it("allows assigned layout editor to view production submission", () => {
    const submission = {
      ...baseSubmission,
      status: "production" as const,
      layoutEditorId: "user-layout",
    };
    expect(canViewSubmission(submission, ["layout_editor"], "user-layout")).toBe(true);
  });

  it("allows layout editor to view unassigned production submission", () => {
    const submission = {
      ...baseSubmission,
      status: "production" as const,
    };
    expect(canViewSubmission(submission, ["layout_editor"], "user-layout")).toBe(true);
  });

  it("blocks layout editor from viewing submission assigned to another editor", () => {
    const submission = {
      ...baseSubmission,
      status: "production" as const,
      layoutEditorId: "user-layout-other",
    };
    expect(canViewSubmission(submission, ["layout_editor"], "user-layout")).toBe(false);
  });
});
