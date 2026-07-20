import { describe, expect, it } from "vitest";
import {
  DEMO_PUBLISHED_PDF_URL,
  filterPublicPublishedArticles,
  formatPublicArticleDate,
  getPublicPublishedArticles,
  getVolumeIssueLabel,
  matchesPublicArticleSearch,
  resolvePublicManuscriptFile,
  resolvePublicManuscriptPdf,
} from "@/lib/store/publicArticles";
import { SEED_JOURNAL_SETTINGS, SEED_SUBMISSIONS, SEED_USERS, SEED_VOLUMES } from "@/lib/store/seed";

describe("publicArticles", () => {
  const getUserById = (id: string) => SEED_USERS.find((u) => u.id === id);

  it("returns published submissions sorted newest first", () => {
    const articles = getPublicPublishedArticles(
      SEED_SUBMISSIONS,
      getUserById,
      SEED_VOLUMES,
      SEED_JOURNAL_SETTINGS,
    );

    expect(articles).toHaveLength(2);
    expect(articles[0]?.id).toBe("sub-010");
    expect(articles[1]?.id).toBe("sub-009");
    expect(articles[0]?.doi).toBe("10.1234/sjms.2026.010");
    expect(articles[0]?.manuscriptFile).toEqual({
      kind: "pdf",
      url: DEMO_PUBLISHED_PDF_URL,
      fileName: "SJMS-2026-010-manuscript.pdf",
    });
  });

  it("resolves uploaded PDF data URLs for public viewing", () => {
    const resolved = resolvePublicManuscriptFile([
      {
        id: "file-1",
        name: "article.pdf",
        type: "manuscript",
        size: 1000,
        uploadedAt: "2026-01-01T00:00:00Z",
        dataUrl: "data:application/pdf;base64,abc",
      },
    ]);

    expect(resolved).toEqual({
      kind: "pdf",
      url: "data:application/pdf;base64,abc",
      fileName: "article.pdf",
    });
  });

  it("prefers publication PDF over copyedited manuscript", () => {
    const resolved = resolvePublicManuscriptFile([
      {
        id: "file-copyedit",
        name: "copyedit.pdf",
        type: "copyedit",
        size: 1100,
        uploadedAt: "2026-01-02T00:00:00Z",
        dataUrl: "data:application/pdf;base64,copyedited",
      },
      {
        id: "file-pub",
        name: "final.pdf",
        type: "publication",
        format: "pdf",
        size: 1200,
        uploadedAt: "2026-01-03T00:00:00Z",
        dataUrl: "data:application/pdf;base64,published",
      },
    ]);

    expect(resolved).toEqual({
      kind: "pdf",
      url: "data:application/pdf;base64,published",
      fileName: "final.pdf",
    });
  });

  it("prefers copyedited PDF over manuscript for public viewing", () => {
    const resolved = resolvePublicManuscriptFile([
      {
        id: "file-ms",
        name: "manuscript.pdf",
        type: "manuscript",
        size: 1000,
        uploadedAt: "2026-01-01T00:00:00Z",
        dataUrl: "data:application/pdf;base64,original",
      },
      {
        id: "file-copyedit",
        name: "manuscript-copyedited.pdf",
        type: "copyedit",
        size: 1100,
        uploadedAt: "2026-01-02T00:00:00Z",
        dataUrl: "data:application/pdf;base64,copyedited",
      },
    ]);

    expect(resolved).toEqual({
      kind: "pdf",
      url: "data:application/pdf;base64,copyedited",
      fileName: "manuscript-copyedited.pdf",
    });
  });

  it("falls back to DOCX preview when no PDF is available", () => {
    const resolved = resolvePublicManuscriptFile([
      {
        id: "file-docx",
        name: "Termez TSIU LINKS-rev.docx",
        type: "manuscript",
        size: 1000,
        uploadedAt: "2026-01-01T00:00:00Z",
        dataUrl:
          "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,abc",
      },
    ]);

    expect(resolved).toEqual({
      kind: "docx",
      url: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,abc",
      fileName: "Termez TSIU LINKS-rev.docx",
    });
  });

  it("prefers PDF over DOCX when both exist", () => {
    const resolved = resolvePublicManuscriptFile([
      {
        id: "file-docx",
        name: "draft.docx",
        type: "manuscript",
        size: 1000,
        uploadedAt: "2026-01-01T00:00:00Z",
        dataUrl:
          "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,abc",
      },
      {
        id: "file-pdf",
        name: "final.pdf",
        type: "publication",
        format: "pdf",
        size: 1200,
        uploadedAt: "2026-01-02T00:00:00Z",
        dataUrl: "data:application/pdf;base64,xyz",
      },
    ]);

    expect(resolved?.kind).toBe("pdf");
  });

  it("falls back to demo PDF for published manuscripts without data URLs", () => {
    const resolved = resolvePublicManuscriptPdf([
      {
        id: "file-009-ms",
        name: "SJMS-2025-009-manuscript.pdf",
        type: "manuscript",
        size: 445_440,
        uploadedAt: "2025-11-01T09:00:00Z",
      },
    ]);

    expect(resolved).toEqual({
      url: DEMO_PUBLISHED_PDF_URL,
      name: "SJMS-2025-009-manuscript.pdf",
    });
  });

  it("does not treat DOCX data URLs as PDF", () => {
    const resolved = resolvePublicManuscriptPdf([
      {
        id: "file-docx",
        name: "article.docx",
        type: "manuscript",
        size: 1000,
        uploadedAt: "2026-01-01T00:00:00Z",
        dataUrl:
          "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,abc",
      },
    ]);

    expect(resolved).toBeUndefined();
  });

  it("formats volume and issue labels", () => {
    expect(getVolumeIssueLabel(SEED_VOLUMES, "vol-2026-1", "issue-2026-1-1")).toBe(
      "Vol. 1, Issue 1 (2026)",
    );
  });

  it("formats publication dates", () => {
    expect(formatPublicArticleDate("2026-05-01T12:00:00Z")).toMatch(/2026/);
  });

  it("matches published submissions by author name", () => {
    const articles = getPublicPublishedArticles(
      SEED_SUBMISSIONS,
      getUserById,
      SEED_VOLUMES,
      SEED_JOURNAL_SETTINGS,
    );
    const janeArticle = articles.find((article) => article.id === "sub-009");

    expect(janeArticle).toBeDefined();
    expect(matchesPublicArticleSearch(janeArticle!, "Jane Author")).toBe(true);
    expect(
      filterPublicPublishedArticles(
        SEED_SUBMISSIONS,
        getUserById,
        SEED_VOLUMES,
        SEED_JOURNAL_SETTINGS,
        "Multi Author",
        "All",
      ),
    ).toHaveLength(1);
  });
});
