export type UserRole = "journal_maker" | "journal_kurator";

export type ArticleStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "revision_required";

export interface Article {
  id: string;
  proposalNumber?: string;
  title: string;
  category: string;
  status: ArticleStatus;
  submittedDate: string;
  lastUpdated: string;
  author: string;
  reviewer?: string;
  comments?: string;
  readTime: number;
}

export type SortDirection = "asc" | "desc";
export type SortColumn = "proposal" | "title" | "author" | "category" | "submitted" | "status" | null;
