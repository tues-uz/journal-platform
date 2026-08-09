import { useRef, useState } from "react";
import { Check, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { isWordUploadFile, WORD_UPLOAD_HINT } from "@/lib/files/submissionFiles";
import type { SubmissionUploadSlot } from "@/lib/files/submissionUploadSlots";
import type { UploadedFileMeta } from "@/components/shared/FileUpload";
import { useToast } from "@/hooks/use-toast";

function SlotInfoButton({ label, description }: { label: string; description: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label={`What is ${label}?`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-72 px-3 py-2 text-sm leading-relaxed"
        >
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface SubmissionFileSlotListProps {
  title: string;
  slots: SubmissionUploadSlot[];
  files: Record<string, UploadedFileMeta[]>;
  onSlotChange: (slotId: SubmissionUploadSlot["id"], files: UploadedFileMeta[]) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileSlotRow({
  slot,
  file,
  onChoose,
  onRemove,
}: {
  slot: SubmissionUploadSlot;
  file?: UploadedFileMeta;
  onChoose: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/40">
        {file ? (
          <Check className="h-4 w-4 text-foreground" strokeWidth={2.5} />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-foreground">
            {slot.label}
            {slot.required ? <span className="text-orange-600"> *</span> : null}
          </p>
          <SlotInfoButton label={slot.label} description={slot.description} />
        </div>
        {file ? (
          <p className="truncate text-xs text-muted-foreground">
            {file.name} · {formatSize(file.size)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Not uploaded</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {file ? (
          <>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onChoose}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onRemove}
            >
              Remove
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-lg px-3 text-xs"
            onClick={onChoose}
          >
            Choose file
          </Button>
        )}
      </div>
    </div>
  );
}

export function SubmissionFileSlotList({
  title,
  slots,
  files,
  onSlotChange,
}: SubmissionFileSlotListProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeSlotId, setActiveSlotId] = useState<SubmissionUploadSlot["id"] | null>(null);

  const openPicker = (slotId: SubmissionUploadSlot["id"]) => {
    setActiveSlotId(slotId);
    inputRef.current?.click();
  };

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = "";

    if (!picked || !activeSlotId) return;

    if (!isWordUploadFile(picked)) {
      toast({
        title: "Unsupported file type",
        description: WORD_UPLOAD_HINT,
        variant: "destructive",
      });
      return;
    }

    onSlotChange(activeSlotId, [
      {
        name: picked.name,
        size: picked.size,
        file: picked,
      },
    ]);
    setActiveSlotId(null);
  };

  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card divide-y divide-border/80">
        {slots.map((slot) => (
          <FileSlotRow
            key={slot.id}
            slot={slot}
            file={files[slot.id]?.[0]}
            onChoose={() => openPicker(slot.id)}
            onRemove={() => onSlotChange(slot.id, [])}
          />
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={handleFilePick}
      />
    </section>
  );
}

interface SubmissionFilesStepProps {
  files: Record<string, UploadedFileMeta[]>;
  onSlotChange: (slotId: SubmissionUploadSlot["id"], files: UploadedFileMeta[]) => void;
  requiredSlots: SubmissionUploadSlot[];
  optionalSlots: SubmissionUploadSlot[];
}

export function SubmissionFilesStep({
  files,
  onSlotChange,
  requiredSlots,
  optionalSlots,
}: SubmissionFilesStepProps) {
  const requiredUploaded = requiredSlots.filter((slot) => (files[slot.id]?.length ?? 0) > 0).length;
  const optionalUploaded = optionalSlots.filter((slot) => (files[slot.id]?.length ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {requiredUploaded} of {requiredSlots.length} required uploaded
          {optionalUploaded > 0 ? ` · ${optionalUploaded} optional` : ""}
        </p>
        <p className="text-xs text-muted-foreground">{WORD_UPLOAD_HINT}</p>
      </div>

      <SubmissionFileSlotList
        title="Required"
        slots={requiredSlots}
        files={files}
        onSlotChange={onSlotChange}
      />

      <SubmissionFileSlotList
        title="Optional"
        slots={optionalSlots}
        files={files}
        onSlotChange={onSlotChange}
      />
    </div>
  );
}
