import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck } from "lucide-react";
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
  "from-emerald-900 to-emerald-700",
  "from-stone-800 to-stone-600",
  "from-teal-900 to-teal-700",
  "from-zinc-800 to-zinc-600",
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
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <BookOpenCheck className="mb-4 h-8 w-8 text-gray-400" />
            <h2 className="font-serif text-3xl font-bold tracking-wide text-black">
              Published articles
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Articles accepted through the {journalName} editorial workflow will appear here once
              the publisher releases them.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-[#1a3a2f] hover:bg-[#142e26]">
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
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Published</p>
            <h2 className="mt-1 font-serif text-3xl font-bold tracking-wide text-black md:text-4xl">
              In {journalName}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-gray-600">
            {hasSearchQuery
              ? "Matching manuscripts from the editorial workflow."
              : "Recently published manuscripts from the journal submission workflow."}
          </p>
        </div>

        {featured && (
          <Link
            to={routes.article(featured.id)}
            className="group mb-10 block border-b border-gray-200 pb-10"
          >
            <article className="grid gap-6 md:grid-cols-12 md:items-stretch">
              <div
                className={`min-h-[16rem] bg-gradient-to-br md:col-span-5 md:min-h-[20rem] ${ARTICLE_GRADIENTS[0]}`}
              />
              <div className="md:col-span-7 self-center">
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{featured.category}</span>
                  <span className="mx-1.5 text-gray-300">·</span>
                  {formatPublicArticleDate(featured.publishedAt)}
                  {featured.volumeIssueLabel && (
                    <>
                      <span className="mx-1.5 text-gray-300">·</span>
                      {featured.volumeIssueLabel}
                    </>
                  )}
                </p>
                <h3 className="mt-2 font-serif text-2xl font-bold leading-tight tracking-wide text-black transition-opacity group-hover:opacity-70 md:text-3xl">
                  {featured.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600 md:text-base">
                  {featured.excerpt}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  {featured.author}
                  {featured.manuscriptFile?.kind === "pdf" && (
                    <span className="ml-2 text-xs font-semibold tracking-wide text-gray-400">
                      PDF
                    </span>
                  )}
                  <span
                    aria-hidden
                    className="ml-3 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500 inline-block"
                  >
                    →
                  </span>
                </p>
              </div>
            </article>
          </Link>
        )}

        {rest.length > 0 && (
          <ul className="grid gap-x-8 gap-y-1 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((article, index) => (
              <li key={article.id}>
                <Link
                  to={routes.article(article.id)}
                  className="group flex h-full flex-col border-b border-gray-200 py-5 transition-colors hover:border-gray-400"
                >
                  <div
                    className={`mb-4 h-44 w-full bg-gradient-to-br md:h-52 ${ARTICLE_GRADIENTS[index % ARTICLE_GRADIENTS.length]}`}
                  />
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{article.category}</span>
                    <span className="mx-1.5 text-gray-300">·</span>
                    {formatPublicArticleDate(article.publishedAt)}
                  </p>
                  <h4 className="mt-1.5 flex-1 font-serif text-lg font-bold leading-snug tracking-wide text-black transition-opacity group-hover:opacity-70">
                    {article.title}
                  </h4>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
                    {article.excerpt}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                    <span>{article.author}</span>
                    <span
                      aria-hidden
                      className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                    >
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
