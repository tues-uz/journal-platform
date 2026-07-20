import type { UploadedFileMeta } from "@/components/shared/FileUpload";
import { readFileAsDataUrl } from "@/lib/files/submissionFiles";
import type { PaymentProofFile } from "@/lib/store/types";

export async function buildPaymentProofFile(
  uploaded: UploadedFileMeta,
  idPrefix: string,
): Promise<PaymentProofFile> {
  return {
    id: `${idPrefix}-proof`,
    name: uploaded.name,
    size: uploaded.size,
    uploadedAt: new Date().toISOString(),
    dataUrl: uploaded.file ? await readFileAsDataUrl(uploaded.file) : undefined,
  };
}

export function downloadPaymentProof(file: PaymentProofFile): boolean {
  if (!file.dataUrl) return false;

  const link = document.createElement("a");
  link.href = file.dataUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

export function isImageProof(file: PaymentProofFile): boolean {
  return /\.(png|jpe?g|gif|webp)$/i.test(file.name) || file.dataUrl?.startsWith("data:image/") === true;
}
