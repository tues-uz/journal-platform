import { describe, expect, it } from "vitest";
import { deriveLayoutPhase } from "@/lib/workflow/layoutPhase";
import type { Submission } from "@/lib/store/types";

function makeSubmission(overrides: Partial<Submission>): Submission {
  return {
    id: "sub-test",
    submissionNumber: "TEST-001",
    title: "Test",
    abstract: "a",
    keywords: [],
    language: "English",
    articleType: "Research Article",
    status: "production",
    authorId: "author-1",
    authors: [],
    files: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("deriveLayoutPhase", () => {
  it("returns null outside production workflow", () => {
    expect(deriveLayoutPhase(makeSubmission({ status: "copyediting" }))).toBeNull();
  });

  it("returns waiting when assigned but not started", () => {
    expect(
      deriveLayoutPhase(
        makeSubmission({
          layoutEditorId: "user-layout",
          proofReady: false,
        }),
      ),
    ).toBe("waiting");
  });

  it("returns waiting for unassigned production submissions", () => {
    expect(
      deriveLayoutPhase(
        makeSubmission({
          proofReady: false,
        }),
      ),
    ).toBe("waiting");
  });

  it("returns in_progress when layout started", () => {
    expect(
      deriveLayoutPhase(
        makeSubmission({
          layoutEditorId: "user-layout",
          layoutStartedAt: "2026-07-19T10:00:00Z",
          proofReady: false,
        }),
      ),
    ).toBe("in_progress");
  });

  it("returns ready_for_proofreading when proof sent to author", () => {
    expect(
      deriveLayoutPhase(
        makeSubmission({
          layoutEditorId: "user-layout",
          layoutStartedAt: "2026-07-19T10:00:00Z",
          proofReady: true,
          proofApproved: false,
        }),
      ),
    ).toBe("ready_for_proofreading");
  });

  it("returns completed when proof approved", () => {
    expect(
      deriveLayoutPhase(
        makeSubmission({
          layoutEditorId: "user-layout",
          proofReady: true,
          proofApproved: true,
        }),
      ),
    ).toBe("completed");
  });

  it("returns completed when published", () => {
    expect(
      deriveLayoutPhase(
        makeSubmission({
          status: "published",
          layoutEditorId: "user-layout",
        }),
      ),
    ).toBe("completed");
  });
});
