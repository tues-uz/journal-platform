import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Clock, Share2 } from "lucide-react";
import JournalHeader from "@/components/JournalHeader";
import Footer from "@/components/Footer";
import { PdfViewer } from "@/components/shared/PdfViewer";
import { DocxViewer } from "@/components/shared/DocxViewer";
import { routes } from "@/app/routes";
import {
  buildArticleBody,
  getLandingArticleById,
} from "@/lib/landing/articles";
import { formatPublicArticleDate } from "@/lib/store/publicArticles";
import { publicArticlesApi } from "@/lib/api/publicArticles";

const ARTICLE_GRADIENTS = [
  "from-slate-800 to-slate-600",
  "from-blue-900 to-blue-700",
  "from-emerald-900 to-emerald-700",
  "from-violet-900 to-violet-700",
  "from-amber-900 to-amber-700",
];

function gradientForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % ARTICLE_GRADIENTS.length;
  }
  return ARTICLE_GRADIENTS[hash];
}

const ArticlePage = () => {
  const { id = "" } = useParams();

  const landingArticle = getLandingArticleById(id);

  const { data: publishedArticle, isLoading } = useQuery({
    queryKey: ["public-article", id],
    queryFn: () => publicArticlesApi.get(id),
    enabled: !!id && !landingArticle,
  });

  if (!landingArticle && isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <JournalHeader />
        <main className="pt-24 pb-16">
          <div className="mx-auto max-w-3xl px-6 text-center text-gray-500">Loading article…</div>
        </main>
      </div>
    );
  }

  if (!landingArticle && !publishedArticle) {
    return <Navigate to="/404" replace />;
  }

  const title = landingArticle?.title ?? publishedArticle!.title;
  const author = landingArticle?.author ?? publishedArticle!.author;
  const authorRole =
    landingArticle?.authorRole ?? publishedArticle!.authorInstitution ?? "Author";
  const authorAvatar = landingArticle?.authorAvatar;
  const image = landingArticle?.image;
  const category = landingArticle?.category ?? publishedArticle!.category;
  const readTime = landingArticle?.readTime;
  const date = landingArticle?.date ?? formatPublicArticleDate(publishedArticle!.publishedAt);
  const excerpt = landingArticle?.excerpt ?? publishedArticle!.excerpt;
  const keywords = publishedArticle?.keywords ?? [];
  const doi = publishedArticle?.doi;
  const volumeIssueLabel = publishedArticle?.volumeIssueLabel;
  const submissionNumber = publishedArticle?.submissionNumber;
  const manuscriptFile = publishedArticle?.manuscriptFile;
  const hasManuscript = Boolean(manuscriptFile);
  const body = hasManuscript
    ? []
    : buildArticleBody({
        title,
        excerpt,
        author,
        category,
        authorRole,
      });

  return (
    <div className="min-h-screen bg-white">
      <JournalHeader />

      <main className="pt-24 pb-16">
        <div className={`mx-auto px-6 ${hasManuscript ? "max-w-5xl" : "max-w-3xl"}`}>
          <Link
            to={routes.home}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to journal
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-600">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">{category}</span>
            {submissionNumber && <span>{submissionNumber}</span>}
            <span>{date}</span>
            {readTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readTime} min read
              </span>
            )}
            {volumeIssueLabel && <span>{volumeIssueLabel}</span>}
            {manuscriptFile?.kind === "pdf" && (
              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-semibold">
                PDF
              </span>
            )}
            {manuscriptFile?.kind === "docx" && (
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                DOCX
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-8">
            {title}
          </h1>

          <div className="flex items-center justify-between gap-4 pb-8 mb-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={author}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradientForId(id)}`}
                />
              )}
              <div>
                <p className="font-medium text-gray-900">{author}</p>
                <p className="text-sm text-gray-600">{authorRole}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Bookmark article"
              >
                <Bookmark className="w-5 h-5 text-gray-600" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Share article"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {!hasManuscript && image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-[360px] object-cover rounded-lg mb-10"
            />
          ) : !hasManuscript ? (
            <div
              className={`w-full h-48 rounded-lg mb-10 bg-gradient-to-br ${gradientForId(id)}`}
            />
          ) : null}

          {hasManuscript ? (
            <div className="space-y-8">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-3">
                  Abstract
                </h2>
                <p className="text-gray-700 leading-relaxed text-lg">{excerpt}</p>
              </section>

              {manuscriptFile!.kind === "pdf" ? (
                <PdfViewer
                  url={manuscriptFile!.url}
                  fileName={manuscriptFile!.fileName}
                  title={title}
                />
              ) : (
                <DocxViewer
                  url={manuscriptFile!.url}
                  fileName={manuscriptFile!.fileName}
                  title={title}
                />
              )}
            </div>
          ) : (
            <article className="prose prose-lg max-w-none">
              {body.map((paragraph, index) => (
                <p key={index} className="text-gray-800 leading-relaxed mb-6 text-lg">
                  {paragraph}
                </p>
              ))}
            </article>
          )}

          {(keywords.length > 0 || doi) && (
            <div className="mt-12 pt-8 border-t border-gray-200 space-y-4">
              {keywords.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {doi && (
                <p className="text-sm text-gray-600">
                  DOI: <span className="font-mono text-gray-800">{doi}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArticlePage;
