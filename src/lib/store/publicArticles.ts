import type {
  JournalSettings,
  StoreUser,
  Submission,
  SubmissionFile,
  Volume,
} from "@/lib/store/types";
import { isDocxDataUrl, isPdfDataUrl } from "@/lib/files/dataUrl";

/** Static demo PDF served for published seed manuscripts without an uploaded data URL. */
export const DEMO_PUBLISHED_PDF_URL = "/articles/sample-manuscript.pdf";

export type PublicManuscriptKind = "pdf" | "docx";

export interface PublicManuscriptDisplay {
  kind: PublicManuscriptKind;
  url: string;
  fileName: string;
}

export interface PublicArticle {
  id: string;
  submissionNumber: string;
  title: string;
  excerpt: string;
  author: string;
  authorInstitution?: string;
  category: string;
  publishedAt: string;
  doi?: string;
  volumeIssueLabel?: string;
  keywords: string[];
  allAuthors: string[];
  manuscriptFile?: PublicManuscriptDisplay;
}

const FILE_TYPE_PRIORITY: SubmissionFile["type"][] = [
  "publication",
  "copyedit",
  "revision",
  "manuscript",
];

function isPdfFile(file: SubmissionFile): boolean {
  if (file.format === "pdf") return true;
  if (file.name.toLowerCase().endsWith(".pdf")) return true;
  if (file.dataUrl && isPdfDataUrl(file.dataUrl)) return true;
  return false;
}

function isDocxFile(file: SubmissionFile): boolean {
  if (file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc")) {
    return true;
  }
  if (file.dataUrl && isDocxDataUrl(file.dataUrl)) return true;
  return false;
}

function resolvePdfUrl(file: SubmissionFile): string | undefined {
  if (file.dataUrl && isPdfDataUrl(file.dataUrl)) return file.dataUrl;
  if (file.name.toLowerCase().endsWith(".pdf")) {
    return file.dataUrl ?? DEMO_PUBLISHED_PDF_URL;
  }
  return undefined;
}

function findPdfByPriority(files: SubmissionFile[]): PublicManuscriptDisplay | undefined {
  for (const type of FILE_TYPE_PRIORITY) {
    for (const file of files.filter((f) => f.type === type && isPdfFile(f))) {
      const url = resolvePdfUrl(file);
      if (url) return { kind: "pdf", url, fileName: file.name };
    }
  }

  for (const file of files.filter(isPdfFile)) {
    const url = resolvePdfUrl(file);
    if (url) return { kind: "pdf", url, fileName: file.name };
  }

  return undefined;
}

function findDocxByPriority(files: SubmissionFile[]): PublicManuscriptDisplay | undefined {
  for (const type of FILE_TYPE_PRIORITY) {
    for (const file of files.filter((f) => f.type === type && isDocxFile(f))) {
      if (file.dataUrl) return { kind: "docx", url: file.dataUrl, fileName: file.name };
    }
  }

  for (const file of files.filter(isDocxFile)) {
    if (file.dataUrl) return { kind: "docx", url: file.dataUrl, fileName: file.name };
  }

  return undefined;
}

export function resolvePublicManuscriptFile(
  files: SubmissionFile[],
): PublicManuscriptDisplay | undefined {
  return findPdfByPriority(files) ?? findDocxByPriority(files);
}

/** @deprecated Use resolvePublicManuscriptFile instead */
export function resolvePublicManuscriptPdf(
  files: SubmissionFile[],
): { url: string; name: string } | undefined {
  const resolved = resolvePublicManuscriptFile(files);
  if (!resolved || resolved.kind !== "pdf") return undefined;
  return { url: resolved.url, name: resolved.fileName };
}

export function getVolumeIssueLabel(
  volumes: Volume[],
  volumeId?: string,
  issueId?: string,
): string | undefined {
  if (!volumeId || !issueId) return undefined;
  const volume = volumes.find((v) => v.id === volumeId);
  const issue = volume?.issues.find((i) => i.id === issueId);
  if (!volume || !issue) return undefined;
  return `Vol. ${volume.number}, Issue ${issue.number} (${volume.year})`;
}

export function getPublicPublishedArticles(
  submissions: Submission[],
  getUserById: (id: string) => StoreUser | undefined,
  volumes: Volume[],
  journalSettings: JournalSettings,
): PublicArticle[] {
  return submissions
    .filter((s) => s.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.updatedAt).getTime() -
        new Date(a.publishedAt ?? a.updatedAt).getTime(),
    )
    .map((submission) => {
      const corresponding =
        submission.authors.find((a) => a.isCorresponding) ?? submission.authors[0];
      const authorUser = getUserById(submission.authorId);
      const manuscriptFile = resolvePublicManuscriptFile(submission.files);
      const allAuthors = [
        ...submission.authors.map((author) => author.name),
        authorUser?.name,
      ].filter((name): name is string => Boolean(name));

      return {
        id: submission.id,
        submissionNumber: submission.submissionNumber,
        title: submission.title,
        excerpt: submission.abstract,
        author: corresponding?.name ?? authorUser?.name ?? "Author",
        authorInstitution: corresponding?.institution ?? authorUser?.institution,
        category: submission.articleType,
        publishedAt: submission.publishedAt ?? submission.updatedAt,
        doi: submission.doi,
        volumeIssueLabel: getVolumeIssueLabel(
          volumes,
          submission.volumeId,
          submission.issueId,
        ),
        keywords: submission.keywords,
        allAuthors: [...new Set(allAuthors)],
        manuscriptFile,
      };
    });
}

export function matchesPublicArticleSearch(article: PublicArticle, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    article.title.toLowerCase().includes(q) ||
    article.excerpt.toLowerCase().includes(q) ||
    article.author.toLowerCase().includes(q) ||
    article.allAuthors.some((name) => name.toLowerCase().includes(q)) ||
    article.category.toLowerCase().includes(q) ||
    article.submissionNumber.toLowerCase().includes(q) ||
    (article.doi?.toLowerCase().includes(q) ?? false) ||
    (article.authorInstitution?.toLowerCase().includes(q) ?? false) ||
    article.keywords.some((keyword) => keyword.toLowerCase().includes(q))
  );
}

export function matchesPublicArticleTopic(article: PublicArticle, topic: string): boolean {
  if (topic === "All") return true;

  const normalizedTopic = topic.toLowerCase();
  return (
    article.category.toLowerCase().includes(normalizedTopic) ||
    article.title.toLowerCase().includes(normalizedTopic) ||
    article.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedTopic))
  );
}

export function filterPublicPublishedArticles(
  submissions: Submission[],
  getUserById: (id: string) => StoreUser | undefined,
  volumes: Volume[],
  journalSettings: JournalSettings,
  query: string,
  topic: string,
): PublicArticle[] {
  return getPublicPublishedArticles(submissions, getUserById, volumes, journalSettings).filter(
    (article) =>
      matchesPublicArticleTopic(article, topic) &&
      matchesPublicArticleSearch(article, query),
  );
}

export function formatPublicArticleDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getJournalDisplayName(settings: JournalSettings): string {
  return settings.shortName || settings.journalName;
}
