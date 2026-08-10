import { apiRequest } from "@/lib/api/client";
import type {
  Submission,
  SubmissionAuthor,
  SubmissionFile,
  SubmissionStatus,
  PlagiarismStatus,
  ReviewerAssignment,
  ReviewerInvitationStatus,
  PublicationFileFormat,
} from "@/lib/store/types";
import {
  fromNumericIssueId,
  fromNumericSubmissionId,
  fromNumericUserId,
  fromNumericVolumeId,
} from "@/lib/demo/ids";
import { isDemoMode } from "@/lib/demo/mode";
import type { SubmissionApcState } from "@/lib/payment/access";

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

interface ReviewerAssignmentDto {
  reviewerId: number;
  invitationStatus: string;
  reviewSubmitted?: boolean;
  recommendation: string | null;
  comments: string | null;
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
  handlingEditorIds: number[] | null;
  reviewerId: number | null;
  reviewerName: string | null;
  pendingReviewerId: number | null;
  reviewerInvitationStatus: string | null;
  reviewers: ReviewerAssignmentDto[] | null;
  hePrescreenComplete: boolean;
  proofReady: boolean;
  proofApproved: boolean;
  acceptancePaymentVerified?: boolean;
  apcPaymentState?: string | null;
  reviewSubmitted: boolean;
  decisionReason: string | null;
  reviewComments: string | null;
  editorRecommendation: string | null;
  editorRecommendationNotes: string | null;
  editorRecommendationAt: string | null;
  revisionRound: number | null;
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

function mapReviewerAssignmentDto(
  dto: ReviewerAssignmentDto,
  resolveUserId: (id: number | string) => string,
): ReviewerAssignment {
  return {
    reviewerId: resolveUserId(dto.reviewerId),
    invitationStatus: dto.invitationStatus.toLowerCase() as ReviewerInvitationStatus,
    reviewSubmitted: dto.reviewSubmitted ?? undefined,
    recommendation: dto.recommendation?.toLowerCase(),
    comments: dto.comments ?? undefined,
  };
}

function mapReviewersFromDto(
  dto: SubmissionDto,
  resolveUserId: (id: number | string) => string,
): ReviewerAssignment[] | undefined {
  if (dto.reviewers?.length) {
    return dto.reviewers.map((slot) => mapReviewerAssignmentDto(slot, resolveUserId));
  }

  const legacy: ReviewerAssignment[] = [];
  if (dto.reviewerId != null) {
    legacy.push({
      reviewerId: resolveUserId(dto.reviewerId),
      invitationStatus:
        (dto.reviewerInvitationStatus?.toLowerCase() as ReviewerInvitationStatus | undefined) ??
        "accepted",
      reviewSubmitted: dto.reviewSubmitted ?? undefined,
    });
  }
  if (dto.pendingReviewerId != null) {
    const pendingId = resolveUserId(dto.pendingReviewerId);
    if (!legacy.some((slot) => slot.reviewerId === pendingId)) {
      legacy.push({
        reviewerId: pendingId,
        invitationStatus: "pending",
      });
    }
  }

  return legacy.length > 0 ? legacy : undefined;
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
  const mapped = {
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
    handlingEditorIds: dto.handlingEditorIds?.map((id) => String(id)),
    reviewerId: dto.reviewerId != null ? String(dto.reviewerId) : undefined,
    reviewerName: dto.reviewerName ?? undefined,
    pendingReviewerId: dto.pendingReviewerId != null ? String(dto.pendingReviewerId) : undefined,
    reviewerInvitationStatus: lower<ReviewerInvitationStatus>(dto.reviewerInvitationStatus),
    reviewers: mapReviewersFromDto(dto, (id) => String(id)),
    hePrescreenComplete: dto.hePrescreenComplete,
    proofReady: dto.proofReady,
    proofApproved: dto.proofApproved,
    acceptancePaymentVerified: dto.acceptancePaymentVerified ?? false,
    apcPaymentState: dto.apcPaymentState
      ? (lower<SubmissionApcState>(dto.apcPaymentState) ?? undefined)
      : undefined,
    reviewSubmitted: dto.reviewSubmitted,
    decisionReason: dto.decisionReason ?? undefined,
    reviewComments: dto.reviewComments ?? undefined,
    editorRecommendation: lower(dto.editorRecommendation),
    editorRecommendationNotes: dto.editorRecommendationNotes ?? undefined,
    editorRecommendationAt: dto.editorRecommendationAt ?? undefined,
    revisionRound: dto.revisionRound ?? undefined,
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

  if (!isDemoMode()) return mapped;

  return {
    ...mapped,
    id: fromNumericSubmissionId(dto.id),
    authorId: fromNumericUserId(dto.authorId) ?? mapped.authorId,
    handlingEditorId: fromNumericUserId(dto.handlingEditorId ?? undefined),
    handlingEditorIds: dto.handlingEditorIds
      ?.map((id) => fromNumericUserId(id))
      .filter((id): id is string => !!id),
    reviewerId: fromNumericUserId(dto.reviewerId ?? undefined),
    pendingReviewerId: fromNumericUserId(dto.pendingReviewerId ?? undefined),
    reviewers: mapReviewersFromDto(dto, (id) => fromNumericUserId(id) ?? String(id)),
    copyeditorId: fromNumericUserId(dto.copyeditorId ?? undefined),
    layoutEditorId: fromNumericUserId(dto.layoutEditorId ?? undefined),
    volumeId: fromNumericVolumeId(dto.volumeId ?? undefined),
    issueId: fromNumericIssueId(dto.issueId ?? undefined),
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

export interface SubmissionUpdateInput {
  title?: string;
  abstractText?: string;
  keywords?: string[];
  language?: string;
  articleType?: string;
  submit?: boolean;
}

export const submissionsApi = {
  async create(input: SubmissionCreateInput): Promise<Submission> {
    const dto = await apiRequest<SubmissionDto>("/api/submissions", { method: "POST", body: input });
    return mapSubmissionDto(dto);
  },

  async update(id: string, input: SubmissionUpdateInput): Promise<Submission> {
    const dto = await apiRequest<SubmissionDto>(`/api/submissions/${id}`, {
      method: "PUT",
      body: input,
    });
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
