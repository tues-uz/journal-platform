import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dataUrlToArrayBuffer } from "@/lib/files/dataUrl";

interface DocxViewerProps {
  url: string;
  fileName: string;
  title?: string;
}

export function DocxViewer({ url, fileName, title = "Article document" }: DocxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    async function renderDocx() {
      setLoading(true);
      setError(null);
      container.innerHTML = "";

      try {
        const buffer = dataUrlToArrayBuffer(url);
        await renderAsync(buffer, container, undefined, {
          className: "docx-preview-content",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
        });
      } catch {
        if (!cancelled) {
          setError("Unable to preview this Word document. Download the file to open it locally.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void renderDocx();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <section className="space-y-4" aria-label="Document viewer">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="font-medium">[DOCX]</span>
          <span className="truncate max-w-[min(100%,20rem)]">{fileName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <a href={url} download={fileName}>
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 py-8 text-center">Loading document preview…</p>
      )}

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="docx-viewer overflow-auto rounded-lg border border-gray-200 bg-white p-4 max-h-[min(80vh,900px)]"
        aria-label={title}
      />
    </section>
  );
}
