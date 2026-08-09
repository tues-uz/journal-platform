import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicationFiles } from "@/lib/files/submissionFiles";
import { getFileDownloadUrl } from "@/lib/api/files";
import type { SubmissionFile } from "@/lib/store/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PublicationProofDownloadListProps {
  submissionId: string;
  files: SubmissionFile[];
  className?: string;
}

export function PublicationProofDownloadList({
  submissionId,
  files,
  className,
}: PublicationProofDownloadListProps) {
  const { toast } = useToast();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const proofFiles = useMemo(
    () =>
      getPublicationFiles(files).sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      ),
    [files],
  );

  const openProof = async (fileId: string) => {
    setOpeningId(fileId);
    try {
      const url = await getFileDownloadUrl(submissionId, fileId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast({
        title: "Download unavailable",
        description: "Could not get a download link for this proof file.",
        variant: "destructive",
      });
    } finally {
      setOpeningId(null);
    }
  };

  if (proofFiles.length === 0) {
    return (
      <p className={cn("w-full text-sm text-amber-700", className)}>
        No layout proof file is attached yet. Check back after the editor uploads it.
      </p>
    );
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      <p className="text-sm text-muted-foreground">
        Download the layout proof, review it, then approve or request corrections below.
      </p>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/80 bg-background">
        {proofFiles.map((file) => (
          <li key={file.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              {file.version ? (
                <p className="text-xs text-muted-foreground">Version {file.version}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-lg"
              disabled={openingId === file.id}
              onClick={() => void openProof(file.id)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {openingId === file.id ? "Opening…" : "Download"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
