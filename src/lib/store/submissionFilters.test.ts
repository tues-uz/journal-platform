import { describe, expect, it } from "vitest";
import {
  filterCompletedLayouts,
  filterPublishedSubmissions,
  filterSubmissionsForEditorial,
  filterSubmissionsForPlagiarism,
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
    title: "Screening",
    abstract: "a",
    keywords: [],
    language: "English",
    articleType: "Research Article",
    status: "administrative_review",
    authorId: "author-2",
    authors: [],
    plagiarismStatus: "pending",
    files: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "sub-011",
    submissionNumber: "SJMS-011",
    title: "Copyediting",
    abstract: "a",
    keywords: [],
    language: "English",
    articleType: "Research Article",
    status: "copyediting",
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
    layoutEditorId: "user-layout",
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

  it("shows screening queue for editorial staff", () => {
    const queue = filterSubmissionsForEditorial(FIXTURES, "user-staff", ["editorial_staff"]);
    expect(queue.map((s) => s.id)).toEqual(["sub-002"]);
  });

  it("shows plagiarism queue", () => {
    const queue = filterSubmissionsForPlagiarism(FIXTURES);
    expect(queue.map((s) => s.id)).toEqual(["sub-002"]);
  });

  it("shows copyediting queue for copyeditors", () => {
    const pipeline = filterSubmissionsForProduction(FIXTURES, ["copyeditor"]);
    expect(pipeline.map((s) => s.id)).toEqual(["sub-011"]);
  });

  it("shows assigned and unassigned production queue for layout editors", () => {
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
      ["layout_editor"],
      "user-layout",
    );
    expect(pipeline.map((s) => s.id).sort()).toEqual(["sub-012", "sub-unassigned"].sort());
  });

  it("computes layout dashboard stats", () => {
    const stats = getLayoutStats(
      [
        ...FIXTURES,
        {
          ...FIXTURES[3],
          id: "sub-waiting",
          layoutEditorId: "user-layout",
          status: "production",
          proofReady: false,
        },
        {
          ...FIXTURES[3],
          id: "sub-progress",
          layoutEditorId: "user-layout",
          status: "production",
          layoutStartedAt: "2026-01-02T00:00:00Z",
          proofReady: false,
        },
        {
          ...FIXTURES[3],
          id: "sub-done",
          layoutEditorId: "user-layout",
          status: "production",
          proofReady: true,
          proofApproved: true,
        },
      ],
      "user-layout",
    );
    expect(stats.assigned).toBeGreaterThanOrEqual(3);
    expect(stats.completed).toBeGreaterThanOrEqual(1);
  });

  it("filters completed layouts for layout editor", () => {
    const completed = filterCompletedLayouts(
      [
        {
          ...FIXTURES[3],
          id: "sub-done",
          layoutEditorId: "user-layout",
          status: "production",
          proofApproved: true,
        },
      ],
      "user-layout",
      ["layout_editor"],
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
