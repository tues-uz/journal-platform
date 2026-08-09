import { describe, expect, it } from "vitest";
import {
  canViewPublicationFiles,
  getNextPublicationVersion,
  getPublicationFiles,
  inferPublicationFormat,
} from "@/lib/files/submissionFiles";
import type { SubmissionFile } from "@/lib/store/types";

describe("publication file helpers", () => {
  it("infers publication format from filename", () => {
    expect(inferPublicationFormat("article.pdf")).toBe("pdf");
    expect(inferPublicationFormat("article.html")).toBe("html");
    expect(inferPublicationFormat("article.xml")).toBe("xml");
    expect(inferPublicationFormat("supplement.zip")).toBe("supplementary");
    expect(inferPublicationFormat("article.docx")).toBe("other");
    expect(inferPublicationFormat("article.doc")).toBe("other");
    expect(inferPublicationFormat("figure-2.jpg")).toBe("supplementary");
  });

  it("filters publication files", () => {
    const files: SubmissionFile[] = [
      {
        id: "1",
        name: "ms.pdf",
        type: "manuscript",
        size: 100,
        uploadedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "pub.pdf",
        type: "publication",
        format: "pdf",
        version: 1,
        size: 100,
        uploadedAt: "2026-01-02T00:00:00Z",
      },
    ];
    expect(getPublicationFiles(files)).toHaveLength(1);
  });

  it("increments version per format", () => {
    const files: SubmissionFile[] = [
      {
        id: "1",
        name: "pub-v1.pdf",
        type: "publication",
        format: "pdf",
        version: 1,
        size: 100,
        uploadedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "pub-v2.pdf",
        type: "publication",
        format: "pdf",
        version: 2,
        size: 100,
        uploadedAt: "2026-01-02T00:00:00Z",
      },
      {
        id: "3",
        name: "pub.html",
        type: "publication",
        format: "html",
        version: 1,
        size: 100,
        uploadedAt: "2026-01-03T00:00:00Z",
      },
    ];
    expect(getNextPublicationVersion(files, "pdf")).toBe(3);
    expect(getNextPublicationVersion(files, "html")).toBe(2);
  });

  it("controls publication file visibility", () => {
    expect(canViewPublicationFiles(["layout_editor"], false)).toBe(true);
    expect(canViewPublicationFiles(["author"], false)).toBe(false);
    expect(canViewPublicationFiles(["author"], true)).toBe(true);
  });
});
