import { apiRequest, ApiClientError } from "@/lib/api/client";
import { fromNumericSubmissionId } from "@/lib/demo/ids";
import { isDemoMode } from "@/lib/demo/mode";
import type { PublicArticle, PublicManuscriptDisplay } from "@/lib/store/publicArticles";

interface PublicAuthorDto {
  name: string;
  institution: string | null;
  corresponding: boolean;
}

interface PublicArticleDto {
  id: number;
  submissionNumber: string;
  title: string;
  abstractText: string;
  keywords: string[];
  language: string;
  articleType: string;
  authors: PublicAuthorDto[];
  doi: string | null;
  publishedAt: string;
  volumeId: number | null;
  volumeNumber: number | null;
  volumeYear: number | null;
  issueId: number | null;
  issueNumber: number | null;
  fileUrl: string | null;
  fileName: string | null;
  fileFormat: string | null;
}

function resolveManuscriptFile(dto: PublicArticleDto): PublicManuscriptDisplay | undefined {
  if (!dto.fileUrl) return undefined;
  const name = dto.fileName ?? dto.fileUrl;
  const lowerName = name.toLowerCase();
  if (dto.fileFormat === "PDF" || lowerName.endsWith(".pdf")) {
    return { kind: "pdf", url: dto.fileUrl, fileName: name };
  }
  if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
    return { kind: "docx", url: dto.fileUrl, fileName: name };
  }
  return undefined;
}

function mapPublicArticleDto(dto: PublicArticleDto): PublicArticle {
  const corresponding = dto.authors.find((a) => a.corresponding) ?? dto.authors[0];
  const volumeIssueLabel =
    dto.volumeNumber != null && dto.issueNumber != null
      ? `Vol. ${dto.volumeNumber}, Issue ${dto.issueNumber}${dto.volumeYear ? ` (${dto.volumeYear})` : ""}`
      : undefined;

  return {
    id: isDemoMode() ? fromNumericSubmissionId(dto.id) : String(dto.id),
    submissionNumber: dto.submissionNumber,
    title: dto.title,
    excerpt: dto.abstractText,
    author: corresponding?.name ?? "Author",
    authorInstitution: corresponding?.institution ?? undefined,
    category: dto.articleType,
    publishedAt: dto.publishedAt,
    doi: dto.doi ?? undefined,
    volumeIssueLabel,
    keywords: dto.keywords,
    allAuthors: [...new Set(dto.authors.map((a) => a.name))],
    manuscriptFile: resolveManuscriptFile(dto),
  };
}

export const publicArticlesApi = {
  /** Unauthenticated — the public journal homepage has no session. Fetches one large page (no UI pagination yet). */
  async list(page = 0, size = 100): Promise<PublicArticle[]> {
    const dtos = await apiRequest<PublicArticleDto[]>("/api/public/articles", {
      params: { page, size },
      auth: false,
    });
    return dtos
      .map(mapPublicArticleDto)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },

  async get(id: string): Promise<PublicArticle | undefined> {
    try {
      const dto = await apiRequest<PublicArticleDto>(`/api/public/articles/${id}`, { auth: false });
      return mapPublicArticleDto(dto);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) return undefined;
      throw err;
    }
  },
};
