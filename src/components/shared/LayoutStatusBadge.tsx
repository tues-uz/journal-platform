import { Badge } from "@/components/ui/badge";
import type { Submission } from "@/lib/store/types";
import { deriveLayoutPhase, type LayoutPhase } from "@/lib/workflow/layoutPhase";
import { cn } from "@/lib/utils";

const LAYOUT_PHASE_CONFIG: Record<
  LayoutPhase,
  { label: string; className: string }
> = {
  waiting: {
    label: "Waiting",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ready_for_proofreading: {
    label: "Ready for Proofreading",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

interface LayoutStatusBadgeProps {
  submission: Submission;
  className?: string;
}

export function LayoutStatusBadge({ submission, className }: LayoutStatusBadgeProps) {
  const phase = deriveLayoutPhase(submission);
  if (!phase) return null;

  const config = LAYOUT_PHASE_CONFIG[phase];
  return (
    <Badge
      variant="outline"
      className={cn("font-medium border rounded-xl", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export function getLayoutPhaseLabel(submission: Submission): string | null {
  const phase = deriveLayoutPhase(submission);
  return phase ? LAYOUT_PHASE_CONFIG[phase].label : null;
}
