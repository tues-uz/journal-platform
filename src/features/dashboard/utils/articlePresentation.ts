import type { ArticleStatus } from "@/features/dashboard/types";

export function getStatusColor(status: ArticleStatus) {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
    case "under_review":
      return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
    case "revision_required":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
    case "submitted":
      return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100";
    case "draft":
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
  }
}

export function getStatusLabel(status: ArticleStatus) {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "under_review":
      return "Under Review";
    case "revision_required":
      return "Revision Required";
    case "submitted":
      return "Submitted";
    case "draft":
      return "Draft";
    default:
      return status;
  }
}

export function formatDate(dateString: string) {
  if (!dateString) return "Not submitted";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
