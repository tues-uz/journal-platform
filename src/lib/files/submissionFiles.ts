import type { Role } from "@/lib/rbac/types";
import type { PublicationFileFormat, SubmissionFile } from "@/lib/store/types";
import type { UploadedFileMeta } from "@/components/shared/FileUpload";

export const MANUSCRIPT_UPLOAD_ACCEPT: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
};

export const MANUSCRIPT_UPLOAD_HINT = "PDF or DOCX, up to 1 file";

export const WORD_UPLOAD_ACCEPT: Record<string, string[]> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
};

export const WORD_UPLOAD_HINT = "DOC or DOCX only";

const WORD_EXTENSIONS = new Set(["doc", "docx"]);

export function isWordUploadFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (WORD_EXTENSIONS.has(extension)) return true;

  return (
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

export const PUBLICATION_UPLOAD_ACCEPT: Record<string, string[]> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
};

export const PUBLICATION_UPLOAD_HINT = "DOC or DOCX only — each upload creates a new version";

const COVER_LETTER_ADMIN_ROLES: Role[] = ["publisher_admin", "editorial_staff"];

const COPYEDIT_FILE_ROLES: Role[] = ["copyeditor", "layout_editor", "publisher_admin"];

const PUBLICATION_FILE_ROLES: Role[] = ["layout_editor", "publisher_admin"];

export function inferPublicationFormat(filename: string): PublicationFileFormat {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "pdf":
      return "pdf";
    case "html":
    case "htm":
      return "html";
    case "xml":
      return "xml";
    case "epub":
      return "epub";
    case "doc":
    case "docx":
      return "other";
    case "zip":
      return "supplementary";
    case "jpg":
    case "jpeg":
    case "png":
      return "supplementary";
    default:
      return "other";
  }
}

export function canViewCoverLetter(roles: Role[], isSubmissionAuthor: boolean): boolean {
  if (isSubmissionAuthor) return true;
  return roles.some((role) => COVER_LETTER_ADMIN_ROLES.includes(role));
}

export function canViewCopyeditFiles(roles: Role[]): boolean {
  return roles.some((role) => COPYEDIT_FILE_ROLES.includes(role));
}

export function canViewPublicationFiles(
  roles: Role[],
  isAuthorDuringProof: boolean,
): boolean {
  if (isAuthorDuringProof) return true;
  return roles.some((role) => PUBLICATION_FILE_ROLES.includes(role));
}

export function getPublicationFiles(files: SubmissionFile[]): SubmissionFile[] {
  return files.filter((file) => file.type === "publication");
}

export function getNextPublicationVersion(
  files: SubmissionFile[],
  format: PublicationFileFormat,
): number {
  const versions = getPublicationFiles(files)
    .filter((file) => file.format === format)
    .map((file) => file.version ?? 1);
  return versions.length === 0 ? 1 : Math.max(...versions) + 1;
}

export function getLatestCopyeditFile(files: SubmissionFile[]): SubmissionFile | undefined {
  return [...files]
    .filter((file) => file.type === "copyedit")
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
}

export function getVisibleSubmissionFiles(
  files: SubmissionFile[],
  roles: Role[],
  isSubmissionAuthor: boolean,
  isAuthorDuringProof = false,
): SubmissionFile[] {
  let visible = files;

  if (!canViewCoverLetter(roles, isSubmissionAuthor)) {
    visible = visible.filter((file) => file.type !== "cover_letter");
  }

  if (!canViewCopyeditFiles(roles)) {
    visible = visible.filter((file) => file.type !== "copyedit");
  }

  if (!canViewPublicationFiles(roles, isAuthorDuringProof)) {
    visible = visible.filter((file) => file.type !== "publication");
  }

  return visible;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function buildSubmissionFilesFromUpload(
  uploaded: UploadedFileMeta[],
  type: SubmissionFile["type"],
  idPrefix: string,
  options?: {
    format?: PublicationFileFormat;
    version?: number;
    uploadedById?: string;
  },
): Promise<SubmissionFile[]> {
  const uploadedAt = new Date().toISOString();

  return Promise.all(
    uploaded.map(async (item, index) => ({
      id: `${idPrefix}-${index}-${Date.now()}`,
      name: item.name,
      type,
      size: item.size,
      uploadedAt,
      dataUrl: item.file ? await readFileAsDataUrl(item.file) : undefined,
      ...(type === "publication"
        ? {
            format: options?.format ?? inferPublicationFormat(item.name),
            version: options?.version,
            uploadedById: options?.uploadedById,
          }
        : {}),
    })),
  );
}

export async function buildPublicationFilesFromUpload(
  uploaded: UploadedFileMeta[],
  existingFiles: SubmissionFile[],
  uploadedById: string,
  idPrefix: string,
): Promise<SubmissionFile[]> {
  const results: SubmissionFile[] = [];

  for (const [index, item] of uploaded.entries()) {
    const format = inferPublicationFormat(item.name);
    const version = getNextPublicationVersion([...existingFiles, ...results], format);
    const [file] = await buildSubmissionFilesFromUpload([item], "publication", `${idPrefix}-${index}`, {
      format,
      version,
      uploadedById,
    });
    results.push(file);
  }

  return results;
}

export function downloadSubmissionFile(file: SubmissionFile): boolean {
  if (!file.dataUrl) return false;

  const link = document.createElement("a");
  link.href = file.dataUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
