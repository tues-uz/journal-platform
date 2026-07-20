import type { SubmissionStatus } from "@/lib/store/types";

export const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
  submitted: { label: "Submitted", className: "bg-blue-50 text-blue-700 border-blue-200" },
  administrative_review: {
    label: "Administrative Review",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  assigned: { label: "Assigned", className: "bg-purple-50 text-purple-700 border-purple-200" },
  under_review: {
    label: "Under Review",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  revision_required: {
    label: "Revision Required",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  accepted: { label: "Accepted", className: "bg-green-50 text-green-700 border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
  copyediting: { label: "Copyediting", className: "bg-teal-50 text-teal-700 border-teal-200" },
  production: { label: "Production", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  published: { label: "Published", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as SubmissionStatus[];

export function getStatusLabel(status: SubmissionStatus): string {
  return STATUS_CONFIG[status]?.label ?? status;
}
