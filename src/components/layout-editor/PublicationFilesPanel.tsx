import { useMemo, useState } from "react";
import { Download, Eye, FileText, Replace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload, type UploadedFileMeta } from "@/components/shared/FileUpload";
import { PdfViewer } from "@/components/shared/PdfViewer";
import {
  buildPublicationFilesFromUpload,
  downloadSubmissionFile,
  getLatestCopyeditFile,
  getPublicationFiles,
  PUBLICATION_UPLOAD_ACCEPT,
  PUBLICATION_UPLOAD_HINT,
} from "@/lib/files/submissionFiles";
import type { PublicationFileFormat, Submission, SubmissionFile } from "@/lib/store/types";
import { useJournalStore } from "@/lib/store/store";
import { useToast } from "@/hooks/use-toast";

const FORMAT_LABELS: Record<PublicationFileFormat, string> = {
  pdf: "PDF",
  html: "HTML",
  xml: "XML",
  epub: "ePub",
  supplementary: "Supplementary",
  other: "Other",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface PublicationFilesPanelProps {
  submission: Submission;
  readOnly?: boolean;
  actorId: string;
  actorName: string;
  getUserById: (id: string) => { name: string } | undefined;
}

export function PublicationFilesPanel({
  submission,
  readOnly = false,
  actorId,
  actorName,
  getUserById,
}: PublicationFilesPanelProps) {
  const { toast } = useToast();
  const uploadPublicationFiles = useJournalStore((s) => s.uploadPublicationFiles);
  const [uploadFiles, setUploadFiles] = useState<UploadedFileMeta[]>([]);
  const [replaceFormat, setReplaceFormat] = useState<PublicationFileFormat | null>(null);
  const [previewFile, setPreviewFile] = useState<SubmissionFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const copyeditFile = getLatestCopyeditFile(submission.files);
  const publicationFiles = getPublicationFiles(submission.files);

  const groupedByFormat = useMemo(() => {
    const groups = new Map<PublicationFileFormat, SubmissionFile[]>();
    for (const file of publicationFiles) {
      const format = file.format ?? "other";
      const existing = groups.get(format) ?? [];
      existing.push(file);
      groups.set(format, existing);
    }
    for (const [, files] of groups) {
      files.sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
    }
    return groups;
  }, [publicationFiles]);

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    try {
      const built = await buildPublicationFilesFromUpload(
        uploadFiles,
        submission.files,
        actorId,
        `pub-${submission.id}`,
      );
      uploadPublicationFiles(submission.id, built, actorId, actorName);
      setUploadFiles([]);
      setReplaceFormat(null);
      toast({ title: "Publication files uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Copyedited Manuscript</CardTitle>
        </CardHeader>
        <CardContent>
          {copyeditFile ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{copyeditFile.name}</span>
                <span className="text-gray-500">{formatFileSize(copyeditFile.size)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {copyeditFile.dataUrl?.startsWith("data:application/pdf") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setPreviewFile(copyeditFile)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Preview
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    if (!downloadSubmissionFile(copyeditFile)) {
                      toast({ title: "Download unavailable", variant: "destructive" });
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No copyedited manuscript available yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Publication Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {publicationFiles.length === 0 ? (
            <p className="text-sm text-gray-500">No publication files uploaded yet.</p>
          ) : (
            Array.from(groupedByFormat.entries()).map(([format, files]) => (
              <div key={format} className="space-y-2">
                <p className="text-sm font-medium text-gray-700">{FORMAT_LABELS[format]}</p>
                {files.map((file) => {
                  const uploader = file.uploadedById
                    ? getUserById(file.uploadedById)
                    : undefined;
                  return (
                    <div
                      key={file.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">{file.name}</span>
                        <span className="ml-2 text-gray-500">v{file.version ?? 1}</span>
                        <span className="ml-2 text-gray-400">
                          {formatDate(file.uploadedAt)}
                          {uploader ? ` · ${uploader.name}` : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {file.dataUrl?.startsWith("data:application/pdf") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setPreviewFile(file)}
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            Preview
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => downloadSubmissionFile(file)}
                        >
                          <Download className="h-4 w-4 mr-1.5" />
                          Download
                        </Button>
                        {!readOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => {
                              setReplaceFormat(format);
                              setUploadFiles([]);
                            }}
                          >
                            <Replace className="h-4 w-4 mr-1.5" />
                            Replace
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {!readOnly && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4">
              {replaceFormat && (
                <p className="mb-3 text-sm text-gray-600">
                  Uploading a new {FORMAT_LABELS[replaceFormat]} file will create the next version.
                </p>
              )}
              <FileUpload
                label="Upload publication files"
                hint={PUBLICATION_UPLOAD_HINT}
                accept={PUBLICATION_UPLOAD_ACCEPT}
                addMoreLabel="Add more files"
                files={uploadFiles}
                onChange={setUploadFiles}
                maxFiles={5}
              />
              <Button
                className="mt-3 rounded-xl"
                disabled={uploadFiles.length === 0 || uploading}
                onClick={handleUpload}
              >
                {uploading ? "Uploading…" : "Upload Files"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {previewFile?.dataUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Preview: {previewFile.name}</p>
            <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
              Close
            </Button>
          </div>
          <PdfViewer url={previewFile.dataUrl} fileName={previewFile.name} />
        </div>
      )}
    </div>
  );
}
