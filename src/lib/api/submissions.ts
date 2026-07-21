import { apiRequest } from "@/lib/api/client";
import type {
  Submission,
  SubmissionAuthor,
  SubmissionFile,
  SubmissionStatus,
  PlagiarismStatus,
  ReviewerInvitationStatus,
  PublicationFileFormat,
} from "@/lib/store/types";

interface SubmissionFileDto {
  id: number;
  name: string;
  type: string;
  size: number;
  feedbackKind: string | null;
  format: string | null;
  version: number | null;
  uploadedById: number;
  uploadedAt: string;
}

export interface SubmissionDto {
  id: number;
  submissionNumber: string;
  title: string;
  abstractText: string;
  keywords: string[];
  language: string;
  articleType: string;
  status: string;
  authorId: number;
  authorName: string;
  authors: SubmissionAuthor[];
  handlingEditorId: number | null;
  handlingEditorName: string | null;
  reviewerId: number | null;
  reviewerName: string | null;
  pendingReviewerId: number | null;
  reviewerInvitationStatus: string | null;
  proofReady: boolean;
  proofApproved: boolean;
  reviewSubmitted: boolean;
  decisionReason: string | null;
  reviewComments: string | null;
  editorRecommendation: string | null;
  editorRecommendationNotes: string | null;
  editorRecommendationAt: string | null;
  copyeditorId: number | null;
  copyeditorName: string | null;
  copyeditedAt: string | null;
  copyeditNotes: string | null;
  layoutEditorId: number | null;
  layoutEditorName: string | null;
  layoutAssignedAt: string | null;
  layoutStartedAt: string | null;
  layoutDueDate: string | null;
  productionNotes: string | null;
  layoutChecklist: Record<string, boolean> | null;
  plagiarismStatus: string | null;
  similarityScore: number | null;
  plagiarismNotes: string | null;
  plagiarismCheckedAt: string | null;
  volumeId: number | null;
  issueId: number | null;
  publishedAt: string | null;
  doi: string | null;
  files: SubmissionFileDto[];
  createdAt: string;
  updatedAt: string;
}

function lower<T extends string>(value: string | null | undefined): T | undefined {
  return value ? (value.toLowerCase() as T) : undefined;
}

function mapFile(dto: SubmissionFileDto): SubmissionFile {
  return {
    id: String(dto.id),
    name: dto.name,
    type: dto.type.toLowerCase() as SubmissionFile["type"],
    size: dto.size,
    uploadedAt: dto.uploadedAt,
    feedbackKind: lower(dto.feedbackKind),
    format: lower<PublicationFileFormat>(dto.format),
    version: dto.version ?? undefined,
    uploadedById: dto.uploadedById != null ? String(dto.uploadedById) : undefined,
  };
}

export function mapSubmissionDto(dto: SubmissionDto): Submission {
  return {
    id: String(dto.id),
    submissionNumber: dto.submissionNumber,
    title: dto.title,
    abstract: dto.abstractText,
    keywords: dto.keywords,
    language: dto.language,
    articleType: dto.articleType,
    status: dto.status.toLowerCase() as SubmissionStatus,
    authorId: String(dto.authorId),
    authorName: dto.authorName,
    authors: dto.authors,
    handlingEditorId: dto.handlingEditorId != null ? String(dto.handlingEditorId) : undefined,
    handlingEditorName: dto.handlingEditorName ?? undefined,
    reviewerId: dto.reviewerId != null ? String(dto.reviewerId) : undefined,
    reviewerName: dto.reviewerName ?? undefined,
    pendingReviewerId: dto.pendingReviewerId != null ? String(dto.pendingReviewerId) : undefined,
    reviewerInvitationStatus: lower<ReviewerInvitationStatus>(dto.reviewerInvitationStatus),
    proofReady: dto.proofReady,
    proofApproved: dto.proofApproved,
    reviewSubmitted: dto.reviewSubmitted,
    decisionReason: dto.decisionReason ?? undefined,
    reviewComments: dto.reviewComments ?? undefined,
    editorRecommendation: lower(dto.editorRecommendation),
    editorRecommendationNotes: dto.editorRecommendationNotes ?? undefined,
    editorRecommendationAt: dto.editorRecommendationAt ?? undefined,
    copyeditorId: dto.copyeditorId != null ? String(dto.copyeditorId) : undefined,
    copyeditorName: dto.copyeditorName ?? undefined,
    copyeditedAt: dto.copyeditedAt ?? undefined,
    copyeditNotes: dto.copyeditNotes ?? undefined,
    layoutEditorId: dto.layoutEditorId != null ? String(dto.layoutEditorId) : undefined,
    layoutEditorName: dto.layoutEditorName ?? undefined,
    layoutAssignedAt: dto.layoutAssignedAt ?? undefined,
    layoutStartedAt: dto.layoutStartedAt ?? undefined,
    layoutDueDate: dto.layoutDueDate ?? undefined,
    productionNotes: dto.productionNotes ?? undefined,
    layoutChecklist: dto.layoutChecklist ?? undefined,
    plagiarismStatus: lower<PlagiarismStatus>(dto.plagiarismStatus),
    similarityScore: dto.similarityScore ?? undefined,
    plagiarismNotes: dto.plagiarismNotes ?? undefined,
    plagiarismCheckedAt: dto.plagiarismCheckedAt ?? undefined,
    volumeId: dto.volumeId != null ? String(dto.volumeId) : undefined,
    issueId: dto.issueId != null ? String(dto.issueId) : undefined,
    publishedAt: dto.publishedAt ?? undefined,
    doi: dto.doi ?? undefined,
    files: dto.files.map(mapFile),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export interface SubmissionCreateInput {
  title: string;
  abstractText: string;
  keywords: string[];
  language: string;
  articleType: string;
  authors: SubmissionAuthor[];
  saveAsDraft: boolean;
}

export const submissionsApi = {
  async create(input: SubmissionCreateInput): Promise<Submission> {
    const dto = await apiRequest<SubmissionDto>("/api/submissions", { method: "POST", body: input });
    return mapSubmissionDto(dto);
  },

  async list(page = 0, size = 100): Promise<Submission[]> {
    const dtos = await apiRequest<SubmissionDto[]>("/api/submissions", { params: { page, size } });
    return dtos.map(mapSubmissionDto);
  },

  async get(id: string): Promise<Submission> {
    const dto = await apiRequest<SubmissionDto>(`/api/submissions/${id}`);
    return mapSubmissionDto(dto);
  },
};
