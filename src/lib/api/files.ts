import { apiRequest } from "@/lib/api/client";
import type { SubmissionFile } from "@/lib/store/types";

interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  expiresAt: string;
}

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

function mapFileDto(dto: SubmissionFileDto): SubmissionFile {
  return {
    id: String(dto.id),
    name: dto.name,
    type: dto.type.toLowerCase() as SubmissionFile["type"],
    size: dto.size,
    uploadedAt: dto.uploadedAt,
    feedbackKind: dto.feedbackKind ? (dto.feedbackKind.toLowerCase() as SubmissionFile["feedbackKind"]) : undefined,
    format: dto.format ? (dto.format.toLowerCase() as SubmissionFile["format"]) : undefined,
    version: dto.version ?? undefined,
    uploadedById: dto.uploadedById != null ? String(dto.uploadedById) : undefined,
  };
}

export type BackendFileType =
  | "MANUSCRIPT"
  | "COVER_LETTER"
  | "SUPPORTING"
  | "REVISION"
  | "COPYEDIT"
  | "RESPONSE_LETTER"
  | "DECISION_FEEDBACK"
  | "PUBLICATION";

export type BackendPublicationFormat = "PDF" | "HTML" | "XML" | "EPUB" | "SUPPLEMENTARY" | "OTHER";

/** Presign → direct PUT to R2 → complete. The three calls a real upload needs. */
export async function uploadSubmissionFile(
  submissionId: string,
  file: File,
  type: BackendFileType,
  options?: { format?: BackendPublicationFormat; feedbackKind?: "REVIEW" | "DECISION" },
): Promise<SubmissionFile> {
  const presigned = await apiRequest<PresignedUploadResponse>(`/api/submissions/${submissionId}/files/presign`, {
    method: "POST",
    body: {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      type,
      format: options?.format,
      feedbackKind: options?.feedbackKind,
    },
  });

  const putRes = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Upload to storage failed (${putRes.status})`);
  }

  const dto = await apiRequest<SubmissionFileDto>(`/api/submissions/${submissionId}/files/complete`, {
    method: "POST",
    body: { key: presigned.key, filename: file.name, type, format: options?.format, feedbackKind: options?.feedbackKind },
  });
  return mapFileDto(dto);
}

export async function uploadSubmissionFiles(
  submissionId: string,
  files: File[],
  type: BackendFileType,
  options?: { format?: BackendPublicationFormat; feedbackKind?: "REVIEW" | "DECISION" },
): Promise<SubmissionFile[]> {
  const results: SubmissionFile[] = [];
  for (const file of files) {
    results.push(await uploadSubmissionFile(submissionId, file, type, options));
  }
  return results;
}

export async function getFileDownloadUrl(submissionId: string, fileId: string): Promise<string> {
  const res = await apiRequest<{ url: string }>(`/api/submissions/${submissionId}/files/${fileId}/download`);
  return res.url;
}
