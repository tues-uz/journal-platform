import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
  fileName: string;
  title?: string;
}

export function PdfViewer({ url, fileName, title = "Article PDF" }: PdfViewerProps) {
  return (
    <section className="space-y-4" aria-label="PDF viewer">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <FileText className="h-4 w-4 text-red-600" />
          <span className="font-medium">[PDF]</span>
          <span className="truncate max-w-[min(100%,20rem)]">{fileName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <a href={url} download={fileName}>
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Open in new tab
            </a>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <iframe
          src={url}
          title={title}
          className="h-[min(80vh,900px)] w-full bg-white"
        />
      </div>
    </section>
  );
}
