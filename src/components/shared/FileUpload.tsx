import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UploadedFileMeta {
  name: string;
  size: number;
  file?: File;
}

interface FileUploadProps {
  label?: string;
  description?: string;
  accept?: Record<string, string[]>;
  files: UploadedFileMeta[];
  onChange: (files: UploadedFileMeta[]) => void;
  maxFiles?: number;
  className?: string;
  hint?: string;
  addMoreLabel?: string;
}

export function FileUpload({
  label = "Upload files",
  description,
  accept = { "application/pdf": [".pdf"], "application/msword": [".doc", ".docx"] },
  files,
  onChange,
  maxFiles = 5,
  className,
  hint,
  addMoreLabel,
}: FileUploadProps) {
  const fileHint = hint ?? `PDF, DOC, DOCX up to ${maxFiles} files`;
  const canAddMore = files.length < maxFiles;
  const isImageUpload = Object.keys(accept).some((type) => type.startsWith("image/"));
  const resolvedAddMoreLabel = addMoreLabel ?? (isImageUpload ? "Add more images" : "Add more files");

  const onDrop = useCallback(
    (accepted: File[]) => {
      const newFiles = accepted.map((file) => ({
        name: file.name,
        size: file.size,
        file,
      }));
      onChange([...files, ...newFiles].slice(0, maxFiles));
    },
    [files, onChange, maxFiles],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    disabled: !canAddMore,
    noClick: files.length > 0,
  });

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {(label || description) && (
        <div className="space-y-1">
          {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )}
      <input {...getInputProps()} className="sr-only" />

      {files.length === 0 ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300",
            !canAddMore && "opacity-50 cursor-not-allowed",
          )}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {isDragActive ? "Drop files here" : "Drag & drop files, or click to browse"}
          </p>
          <p className="text-xs text-gray-400 mt-1">{fileHint}</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                {isImageUpload && file.file ? (
                  <img
                    src={URL.createObjectURL(file.file)}
                    alt={file.name}
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>

          {canAddMore && (
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => open()}>
              {isImageUpload ? (
                <ImagePlus className="h-4 w-4 mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {resolvedAddMoreLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
