import type { Submission } from "@/lib/store/types";

export type LayoutPhase =
  | "waiting"
  | "in_progress"
  | "ready_for_proofreading"
  | "completed";

export function deriveLayoutPhase(submission: Submission): LayoutPhase | null {
  if (submission.status !== "production" && submission.status !== "published") {
    return null;
  }

  if (submission.proofApproved || submission.status === "published") {
    return "completed";
  }

  if (submission.proofReady) {
    return "ready_for_proofreading";
  }

  if (submission.layoutStartedAt) {
    return "in_progress";
  }

  if (submission.status === "production") {
    return "waiting";
  }

  return null;
}

export const LAYOUT_CHECKLIST_ITEMS = [
  { id: "journal_template", label: "Journal template applied" },
  { id: "fonts_verified", label: "Fonts verified" },
  { id: "margins_verified", label: "Margins verified" },
  { id: "headers_footers", label: "Headers and footers" },
  { id: "doi_included", label: "DOI included" },
  { id: "figures_positioned", label: "Figures positioned correctly" },
  { id: "tables_formatted", label: "Tables formatted" },
  { id: "references_formatted", label: "References formatted" },
  { id: "page_numbering", label: "Page numbering" },
  { id: "hyperlinks_verified", label: "Hyperlinks verified" },
  { id: "pdf_opens", label: "PDF opens correctly" },
  { id: "accessibility", label: "Accessibility checked (optional)" },
] as const;

export function createDefaultLayoutChecklist(): Record<string, boolean> {
  return Object.fromEntries(LAYOUT_CHECKLIST_ITEMS.map((item) => [item.id, false]));
}
