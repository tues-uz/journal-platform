import { Link } from "react-router-dom";
import { routes } from "@/app/routes";
import type { IssueArticle } from "@/lib/journal/issueArticles";

interface IssueTocListProps {
  sectionTitle: string;
  articles: IssueArticle[];
}

export function IssueTocList({ sectionTitle, articles }: IssueTocListProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-4">
        {sectionTitle}
      </h3>

      <div className="space-y-4">
        {articles.map((article) => (
          <div
            key={article.id}
            className="flex flex-col gap-2 border-b border-gray-200 pb-4 last:border-0 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <Link
                to={routes.article(article.id)}
                className="font-medium text-gray-900 hover:text-gray-700 transition-colors"
              >
                {article.title}
              </Link>
              <p className="mt-1 text-sm text-gray-600">{article.authors}</p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-sm text-gray-500">
              <a
                href={article.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                PDF
              </a>
              <span>{article.pages}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
