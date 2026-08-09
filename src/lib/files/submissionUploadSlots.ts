import type { UploadedFileMeta } from "@/components/shared/FileUpload";
import type { BackendFileType } from "@/lib/api/files";

export type SubmissionUploadSlotId =
  | "titlePage"
  | "anonymousManuscript"
  | "coverLetter"
  | "table"
  | "figure"
  | "plagiarismReport"
  | "appendix"
  | "proofreadingCertificate";

export interface SubmissionUploadSlot {
  id: SubmissionUploadSlotId;
  label: string;
  description: string;
  required: boolean;
  backendType: BackendFileType;
}

export const SUBMISSION_UPLOAD_SLOTS: SubmissionUploadSlot[] = [
  {
    id: "titlePage",
    label: "Title page",
    description:
      "A separate Word file with the full article title, author names, affiliations, and contact details. This file is not shared with reviewers.",
    required: true,
    backendType: "SUPPORTING",
  },
  {
    id: "anonymousManuscript",
    label: "Anonymous manuscript",
    description:
      "The main article in Word format with all author names and identifying details removed for blind review.",
    required: true,
    backendType: "MANUSCRIPT",
  },
  {
    id: "coverLetter",
    label: "Cover letter",
    description:
      "A letter to the editor explaining why the manuscript matters and why it fits this journal.",
    required: false,
    backendType: "COVER_LETTER",
  },
  {
    id: "table",
    label: "Table",
    description: "Word file containing tables referenced in the manuscript.",
    required: false,
    backendType: "SUPPORTING",
  },
  {
    id: "figure",
    label: "Figure",
    description: "Word file with figures or figure captions that accompany the manuscript.",
    required: false,
    backendType: "SUPPORTING",
  },
  {
    id: "plagiarismReport",
    label: "Plagiarism report",
    description:
      "Similarity or plagiarism screening report from your institution or detection service, if available.",
    required: false,
    backendType: "SUPPORTING",
  },
  {
    id: "appendix",
    label: "Appendix",
    description: "Supplementary material such as extended data, instruments, or additional analysis.",
    required: false,
    backendType: "SUPPORTING",
  },
  {
    id: "proofreadingCertificate",
    label: "Proofreading certificate",
    description:
      "Certificate or statement confirming professional language editing, if your submission requires it.",
    required: false,
    backendType: "SUPPORTING",
  },
];

export const REQUIRED_SUBMISSION_UPLOAD_SLOTS = SUBMISSION_UPLOAD_SLOTS.filter((slot) => slot.required);

export const OPTIONAL_SUBMISSION_UPLOAD_SLOTS = SUBMISSION_UPLOAD_SLOTS.filter((slot) => !slot.required);

export function createEmptySubmissionUploadFiles(): Record<SubmissionUploadSlotId, UploadedFileMeta[]> {
  return SUBMISSION_UPLOAD_SLOTS.reduce(
    (acc, slot) => {
      acc[slot.id] = [];
      return acc;
    },
    {} as Record<SubmissionUploadSlotId, UploadedFileMeta[]>,
  );
}

export function hasRequiredSubmissionUploads(files: Record<SubmissionUploadSlotId, UploadedFileMeta[]>): boolean {
  return REQUIRED_SUBMISSION_UPLOAD_SLOTS.every((slot) => files[slot.id].length > 0);
}
