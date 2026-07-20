import type { SubmissionFile } from "@/lib/store/types";
import type { UploadedFileMeta } from "@/components/shared/FileUpload";
import { readFileAsDataUrl } from "@/lib/files/submissionFiles";

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function buildFeedbackFiles(
  uploaded: UploadedFileMeta[],
  feedbackKind: "review" | "decision",
): Promise<SubmissionFile[]> {
  return Promise.all(
    uploaded.map(async (item) => ({
      id: generateId("file"),
      name: item.name,
      type: "decision_feedback" as const,
      size: item.size,
      uploadedAt: new Date().toISOString(),
      dataUrl: item.file ? await readFileAsDataUrl(item.file) : undefined,
      feedbackKind,
    })),
  );
}
