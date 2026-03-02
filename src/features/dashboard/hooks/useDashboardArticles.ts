import { useMemo } from "react";
import { getKuratorArticles, getMakerArticles } from "@/features/dashboard/data/mockArticles";
import type {
  Article,
  ArticleStatus,
  SortColumn,
  SortDirection,
  UserRole,
} from "@/features/dashboard/types";

function getSortValue(article: Article, sortColumn: Exclude<SortColumn, null>): string | number {
  switch (sortColumn) {
    case "proposal":
      return article.proposalNumber || `ts-${String(article.id).padStart(3, "0")}`;
    case "title":
      return article.title.toLowerCase();
    case "author":
      return article.author.toLowerCase();
    case "category":
      return article.category.toLowerCase();
    case "submitted":
      return article.submittedDate ? new Date(article.submittedDate).getTime() : 0;
    case "status":
      return article.status;
  }
}

export function useDashboardArticles(params: {
  userRole: UserRole;
  userName: string;
  searchQuery: string;
  statusFilter: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}) {
  const { userRole, userName, searchQuery, statusFilter, sortColumn, sortDirection } = params;

  const articles = useMemo(
    () => (userRole === "journal_kurator" ? getKuratorArticles(userName) : getMakerArticles(userName)),
    [userRole, userName]
  );

  const derived = useMemo(
    () =>
      deriveDashboardArticles({
        articles,
        searchQuery,
        statusFilter,
        sortColumn,
        sortDirection,
      }),
    [articles, searchQuery, sortColumn, sortDirection, statusFilter]
  );

  return {
    articles,
    filteredArticles: derived.filteredArticles,
    sortedArticles: derived.sortedArticles,
    statusCounts: derived.statusCounts,
  };
}

export function deriveDashboardArticles(params: {
  articles?: Article[];
  userRole?: UserRole;
  userName?: string;
  searchQuery: string;
  statusFilter: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}) {
  const sourceArticles =
    params.articles ||
    (params.userRole === "journal_kurator"
      ? getKuratorArticles(params.userName || "User")
      : getMakerArticles(params.userName || "User"));

  const filteredArticles = sourceArticles.filter((article) => {
    const query = params.searchQuery.toLowerCase();
    const matchesSearch =
      article.title.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query) ||
      article.author.toLowerCase().includes(query);

    const matchesStatus = params.statusFilter === "all" || article.status === params.statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedArticles = (() => {
    if (!params.sortColumn) return filteredArticles;

    return [...filteredArticles].sort((a, b) => {
      const aValue = getSortValue(a, params.sortColumn as Exclude<SortColumn, null>);
      const bValue = getSortValue(b, params.sortColumn as Exclude<SortColumn, null>);

      if (aValue < bValue) return params.sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return params.sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  })();

  const initial: Record<ArticleStatus, number> = {
    accepted: 0,
    draft: 0,
    rejected: 0,
    revision_required: 0,
    submitted: 0,
    under_review: 0,
  };

  const statusCounts = sourceArticles.reduce((counts, article) => {
    counts[article.status] += 1;
    return counts;
  }, initial);

  return {
    filteredArticles,
    sortedArticles,
    statusCounts,
  };
}
