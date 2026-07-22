import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/app/routes";
import { publicArticlesApi } from "@/lib/api/publicArticles";
import { publicSettingsApi } from "@/lib/api/publicSettings";
import {
  formatPublicArticleDate,
  matchesPublicArticleSearch,
  matchesPublicArticleTopic,
} from "@/lib/store/publicArticles";

const ARTICLE_GRADIENTS = [
  "from-slate-800 to-slate-600",
  "from-blue-900 to-blue-700",
  "from-emerald-900 to-emerald-700",
  "from-violet-900 to-violet-700",
  "from-amber-900 to-amber-700",
];

interface PublishedArticlesSectionProps {
  searchQuery?: string;
  selectedTopic?: string;
}

export function PublishedArticlesSection({
  searchQuery = "",
  selectedTopic = "All",
}: PublishedArticlesSectionProps) {
  const { data: allArticles = [] } = useQuery({
    queryKey: ["public-articles"],
    queryFn: () => publicArticlesApi.list(),
  });
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => publicSettingsApi.get(),
  });

  const articles = allArticles.filter(
    (article) =>
      matchesPublicArticleTopic(article, selectedTopic) &&
      matchesPublicArticleSearch(article, searchQuery),
  );
  const journalName = settings ? settings.shortName || settings.journalName : "the journal";
  const [featured, ...rest] = articles;
  const hasSearchQuery = searchQuery.trim().length > 0;

  if (articles.length === 0) {
    if (hasSearchQuery && allArticles.length > 0) {
      return null;
    }

    return (
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <BookOpenCheck className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Published Articles</h2>
            <p className="text-gray-600 mb-6">
              Articles accepted through the {journalName} editorial workflow will appear here
              once the publisher releases them.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="rounded-full bg-gray-900 hover:bg-gray-800">
                <Link to={routes.register}>Submit a manuscript</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to={routes.signin}>Editorial team sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Live from the platform</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Published in {journalName}</h2>
            <p className="text-gray-600">
              {hasSearchQuery
                ? "Matching manuscripts submitted and published through the editorial workflow"
                : "Recently published manuscripts from the journal submission workflow"}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to={routes.register}>Submit your manuscript</Link>
          </Button>
        </div>

        {featured && (
          <Link to={routes.article(featured.id)} className="block mb-8 group">
            <article className="rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-700 text-white transition-opacity group-hover:opacity-95">
            <div className="p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-white/80">
                <span className="px-3 py-1 rounded-full bg-white/15">{featured.category}</span>
                <span>{featured.submissionNumber}</span>
                <span>·</span>
                <span>{formatPublicArticleDate(featured.publishedAt)}</span>
                {featured.volumeIssueLabel && (
                  <>
                    <span>·</span>
                    <span>{featured.volumeIssueLabel}</span>
                  </>
                )}
              </div>
              <h3 className="text-3xl font-bold mb-3 leading-tight">{featured.title}</h3>
              <p className="text-white/90 text-lg leading-relaxed mb-4 line-clamp-3">
                {featured.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span>{featured.author}</span>
                {featured.authorInstitution && (
                  <>
                    <span>·</span>
                    <span>{featured.authorInstitution}</span>
                  </>
                )}
                {featured.doi && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-xs">{featured.doi}</span>
                  </>
                )}
                {featured.manuscriptFile?.kind === "pdf" && (
                  <>
                    <span>·</span>
                    <span className="px-2 py-0.5 rounded bg-white/20 text-xs font-semibold">
                      PDF
                    </span>
                  </>
                )}
                {featured.manuscriptFile?.kind === "docx" && (
                  <>
                    <span>·</span>
                    <span className="px-2 py-0.5 rounded bg-white/20 text-xs font-semibold">
                      DOCX
                    </span>
                  </>
                )}
              </div>
            </div>
            </article>
          </Link>
        )}

        {rest.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article, index) => (
              <Link
                key={article.id}
                to={routes.article(article.id)}
                className="block group"
              >
                <article className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full">
                <div
                  className={`h-32 bg-gradient-to-br ${ARTICLE_GRADIENTS[index % ARTICLE_GRADIENTS.length]}`}
                />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatPublicArticleDate(article.publishedAt)}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{article.author}</span>
                  </div>
                  {article.doi && (
                    <p className="mt-2 font-mono text-xs text-gray-500 truncate">{article.doi}</p>
                  )}
                  {article.manuscriptFile?.kind === "pdf" && (
                    <p className="mt-2 text-xs font-semibold text-red-700">[PDF]</p>
                  )}
                  {article.manuscriptFile?.kind === "docx" && (
                    <p className="mt-2 text-xs font-semibold text-blue-700">[DOCX]</p>
                  )}
                </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
