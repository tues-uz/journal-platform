import { describe, expect, it } from "vitest";
import {
  filterCompletedLayouts,
  filterPublishedSubmissions,
  filterSubmissionsForEditorial,
  filterSubmissionsForProduction,
  filterSubmissionsForReviews,
  filterSubmissionsReadyToPublish,
  getLayoutStats,
} from "@/lib/store/submissionFilters";
import type { Submission } from "@/lib/store/types";

const FIXTURES: Submission[] = [
  {
    id: "sub-001",
    submissionNumber: "SJMS-001",
    title: "Under review assigned",
    abstract: "a",
    keywords: [],
    language: "English",
    articleType: "Research Article",
    status: "under_review",
    authorId: "author-1",
    authors: [],
    handlingEditorId: "user-he",
    reviewerId: "user-reviewer",
    reviewerInvitationStatus: "accepted",
    files: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "sub-002",
    submissionNumber: "SJMS-002",
    title: "Submitted",
    abstract: "a",
    keywords: [],
    language: "English",
    articleType: "Research Article",
    status: "submitted",
    authorId: "author-2",
    authors: [],
    files: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "sub-011",
    submissionNumber: "SJMS-011",
    title: "Accepted",
    abstract: "a",
    keywords: [],
    language: "English",
    articleType: "Research Article",
    status: "accepted",
    authorId: "author-3",
    authors: [],
    files: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "sub-012",
    submissionNumber: "SJMS-012",
    title: "Production",
    abstract: "a",
    keywords: [],
    language: "English",
    articleType: "Research Article",
    status: "production",
    authorId: "author-4",
    authors: [],
    layoutEditorId: "user-production",
    proofReady: true,
    files: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "sub-013",
    submissionNumber: "SJMS-013",
    title: "Published",
    abstract: "a",
    keywords: [],
    language: "English",
    articleType: "Research Article",
    status: "published",
    authorId: "user-author",
    authors: [],
    files: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
];

describe("submissionFilters", () => {
  it("shows assigned reviews for reviewers", () => {
    const reviews = filterSubmissionsForReviews(FIXTURES, "user-reviewer", ["reviewer"]);
    expect(reviews.map((s) => s.id)).toEqual(["sub-001"]);
  });

  it("shows pending invitations from reviewers array while status is assigned", () => {
    const reviews = filterSubmissionsForReviews(
      [
        {
          ...FIXTURES[0]!,
          id: "sub-pending",
          status: "assigned",
          reviewerId: undefined,
          pendingReviewerId: undefined,
          reviewerInvitationStatus: undefined,
          reviewers: [{ reviewerId: "user-reviewer2", invitationStatus: "pending" }],
        },
      ],
      "user-reviewer2",
      ["reviewer"],
    );
    expect(reviews.map((s) => s.id)).toEqual(["sub-pending"]);
  });

  it("shows submitted queue for editor in chief", () => {
    const queue = filterSubmissionsForEditorial(FIXTURES, "user-eic", ["editor_in_chief"]);
    expect(queue.map((s) => s.id)).toEqual(["sub-002"]);
  });

  it("shows accepted and production queue for production editors", () => {
    const pipeline = filterSubmissionsForProduction(FIXTURES, ["production_editor"], "user-production");
    expect(pipeline.map((s) => s.id).sort()).toEqual(["sub-011", "sub-012"].sort());
  });

  it("shows assigned and unassigned production queue for production editors", () => {
    const pipeline = filterSubmissionsForProduction(
      [
        ...FIXTURES,
        {
          ...FIXTURES[3],
          id: "sub-unassigned",
          status: "production",
          proofReady: false,
        },
      ],
      ["production_editor"],
      "user-production",
    );
    expect(pipeline.map((s) => s.id).sort()).toEqual(["sub-011", "sub-012", "sub-unassigned"].sort());
  });

  it("computes layout dashboard stats", () => {
    const stats = getLayoutStats(
      [
        ...FIXTURES,
        {
          ...FIXTURES[3],
          id: "sub-waiting",
          layoutEditorId: "user-production",
          status: "production",
          proofReady: false,
        },
        {
          ...FIXTURES[3],
          id: "sub-progress",
          layoutEditorId: "user-production",
          status: "production",
          layoutStartedAt: "2026-01-02T00:00:00Z",
          proofReady: false,
        },
        {
          ...FIXTURES[3],
          id: "sub-done",
          layoutEditorId: "user-production",
          status: "production",
          proofReady: true,
          proofApproved: true,
        },
      ],
      "user-production",
    );
    expect(stats.assigned).toBeGreaterThanOrEqual(3);
    expect(stats.completed).toBeGreaterThanOrEqual(1);
  });

  it("filters completed layouts for production editor", () => {
    const completed = filterCompletedLayouts(
      [
        {
          ...FIXTURES[3],
          id: "sub-done",
          layoutEditorId: "user-production",
          status: "production",
          proofApproved: true,
        },
      ],
      "user-production",
      ["production_editor"],
    );
    expect(completed.map((s) => s.id)).toEqual(["sub-done"]);
  });

  it("shows ready-to-publish queue for publisher admin", () => {
    const ready = filterSubmissionsReadyToPublish(
      [
        ...FIXTURES,
        {
          ...FIXTURES[0],
          id: "sub-ready",
          status: "production",
          proofApproved: true,
        },
      ],
      ["publisher_admin"],
    );
    expect(ready.map((s) => s.id)).toEqual(["sub-ready"]);
  });

  it("scopes published articles for authors", () => {
    const published = filterPublishedSubmissions(FIXTURES, "user-author", ["author"]);
    expect(published.map((s) => s.id)).toEqual(["sub-013"]);
  });
});
