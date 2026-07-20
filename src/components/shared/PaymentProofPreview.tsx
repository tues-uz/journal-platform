import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPaymentProof, isImageProof } from "@/lib/payment/files";
import type { PaymentProofFile } from "@/lib/store/types";

interface PaymentProofPreviewProps {
  file: PaymentProofFile;
}

export function PaymentProofPreview({ file }: PaymentProofPreviewProps) {
  const isImage = isImageProof(file);

  return (
    <div className="space-y-3">
      {isImage && file.dataUrl ? (
        <figure className="rounded-xl overflow-hidden border bg-white">
          <img src={file.dataUrl} alt={file.name} className="w-full max-h-80 object-contain bg-gray-50" />
          <figcaption className="px-3 py-2 text-xs text-gray-500 truncate border-t">{file.name}</figcaption>
        </figure>
      ) : (
        <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
          {file.name}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl"
        onClick={() => downloadPaymentProof(file)}
        disabled={!file.dataUrl}
      >
        <Download className="h-4 w-4 mr-2" />
        Download proof
      </Button>
    </div>
  );
}
