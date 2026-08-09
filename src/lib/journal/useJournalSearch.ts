import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { filterLandingArticles, LANDING_ARTICLES } from "@/lib/landing/articles";
import { publicArticlesApi } from "@/lib/api/publicArticles";
import { matchesPublicArticleSearch, matchesPublicArticleTopic, type PublicArticle } from "@/lib/store/publicArticles";

export type SearchScope = "all" | "authors" | "title" | "abstract" | "keywords";

export const SEARCH_SCOPES: { value: SearchScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "authors", label: "Authors" },
  { value: "title", label: "Title" },
  { value: "abstract", label: "Abstract" },
  { value: "keywords", label: "Keywords" },
];

export const JOURNAL_TOPICS = [
  "All",
  "Macroeconomics",
  "Microeconomics",
  "Policy & Reform",
  "Data Analysis",
  "Behavioral Economics",
  "International Trade",
  "Development Economics",
  "Financial Markets",
  "Public Policy",
  "Research",
];

function matchesLandingScope(
  article: (typeof LANDING_ARTICLES)[number],
  query: string,
  scope: SearchScope,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  switch (scope) {
    case "authors":
      return article.author.toLowerCase().includes(q);
    case "title":
      return article.title.toLowerCase().includes(q);
    case "abstract":
      return article.excerpt.toLowerCase().includes(q);
    case "keywords":
      return article.category.toLowerCase().includes(q);
    default:
      return (
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.author.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q)
      );
  }
}

function matchesPublishedScope(
  article: PublicArticle,
  query: string,
  scope: SearchScope,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  switch (scope) {
    case "authors":
      return (
        article.author.toLowerCase().includes(q) ||
        article.allAuthors.some((name) => name.toLowerCase().includes(q))
      );
    case "title":
      return article.title.toLowerCase().includes(q);
    case "abstract":
      return article.excerpt.toLowerCase().includes(q);
    case "keywords":
      return article.keywords.some((keyword) => keyword.toLowerCase().includes(q));
    default:
      return matchesPublicArticleSearch(article, query);
  }
}

export function useJournalSearch(searchQuery: string, selectedTopic: string, scope: SearchScope = "all") {
  const { data: publishedArticles = [], isLoading } = useQuery({
    queryKey: ["public-articles"],
    queryFn: () => publicArticlesApi.list(),
  });

  const filteredArticles = useMemo(() => {
    const topicFiltered = filterLandingArticles(LANDING_ARTICLES, "", selectedTopic);
    return topicFiltered.filter((article) => matchesLandingScope(article, searchQuery, scope));
  }, [searchQuery, selectedTopic, scope]);

  const filteredPublishedArticles = useMemo(
    () =>
      publishedArticles.filter(
        (article) =>
          matchesPublicArticleTopic(article, selectedTopic) &&
          matchesPublishedScope(article, searchQuery, scope),
      ),
    [publishedArticles, searchQuery, selectedTopic, scope],
  );

  const totalResults = filteredArticles.length + filteredPublishedArticles.length;
  const hasActiveSearch = searchQuery.trim().length > 0;
  const hasActiveFilters = selectedTopic !== "All" || scope !== "all";

  return {
    filteredArticles,
    filteredPublishedArticles,
    publishedArticles,
    totalResults,
    hasActiveSearch,
    hasActiveFilters,
    isLoading,
  };
}
