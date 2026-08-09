import PublicJournalLayout from "@/components/layout/PublicJournalLayout";
import { PublishedArticlesSection } from "@/components/landing/PublishedArticlesSection";
import JournalSidebar from "@/components/JournalSidebar";
import { Clock, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { routes } from "@/app/routes";
import { JOURNAL_SUBJECTS } from "@/lib/journal/subjects";
import { useJournalSearch } from "@/lib/journal/useJournalSearch";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80";

const Journal = () => {
  const [searchParams] = useSearchParams();
  const topicFromUrl = searchParams.get("topic");
  const [selectedTopic, setSelectedTopic] = useState(topicFromUrl || "All");
  const [searchQuery, setSearchQuery] = useState("");
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!topicFromUrl) return;
    setSelectedTopic(topicFromUrl);
    setSearchQuery("");
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [topicFromUrl]);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectSubject = (subject: string) => {
    setSelectedTopic(subject);
    setSearchQuery("");
    requestAnimationFrame(() => scrollToResults());
  };

  const {
    filteredArticles,
    filteredPublishedArticles,
    totalResults,
    hasActiveSearch,
  } = useJournalSearch(searchQuery, selectedTopic);

  const searchFeedback = hasActiveSearch
    ? totalResults === 0
      ? "No articles or author submissions match your search."
      : `${totalResults} result${totalResults === 1 ? "" : "s"} found${
          filteredPublishedArticles.length > 0
            ? ` (${filteredPublishedArticles.length} published submission${
                filteredPublishedArticles.length === 1 ? "" : "s"
              })`
            : ""
        }`
    : "";

  const featuredArticle = filteredArticles.find((a) => a.featured);
  const regularArticles = filteredArticles.filter((a) => !a.featured);

  return (
    <PublicJournalLayout showSidebar={false}>
      {/* Split hero — white typography + full-bleed image */}
      <section className="flex h-[100dvh] flex-col bg-white">
        <div className="relative flex flex-[1.05] flex-col justify-end overflow-hidden px-6 pb-10 pt-24 md:px-12 lg:px-16 lg:pb-14">
          <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 md:grid-cols-12 md:items-end md:gap-12">
            <div className="animate-hero-fade-up md:col-span-4">
              <p className="font-sans text-sm font-semibold text-gray-900">About the journal</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">
                Peer-reviewed research, commentary, and policy analysis across economics—with a focus on Central Asia and emerging economies.
              </p>
              <Link
                to={routes.about}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 transition-colors hover:text-gray-700"
              >
                Read more
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="animate-hero-fade-up-delayed md:col-span-8">
              <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-wide text-black sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                TUES Economics Journal
              </h1>
              <p className="mt-4 max-w-xl text-base text-gray-600 md:text-lg">
                Search by author, DOI, title, or keyword.
              </p>

              <form
                className="relative mt-8 max-w-xl"
                onSubmit={(event) => {
                  event.preventDefault();
                  scrollToResults();
                }}
              >
                <label className="group relative flex items-center gap-3 border-b border-gray-900/15 pb-3 transition-colors focus-within:border-oxford-blue">
                  <span className="sr-only">Search by author name or DOI</span>
                  <Search
                    className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-focus-within:text-oxford-blue"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Author name or DOI"
                    aria-label="Search by author name or DOI"
                    className="peer min-w-0 flex-1 border-0 bg-transparent py-2 text-sm leading-none text-gray-900 outline-none placeholder:text-gray-400 [appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden md:text-base"
                  />
                  <button
                    type="submit"
                    className="shrink-0 bg-journal-teal px-5 py-2.5 text-sm font-medium leading-none text-white transition-colors hover:bg-journal-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-journal-teal/40 focus-visible:ring-offset-2 rounded-none"
                  >
                    Search
                  </button>
                </label>
                <p
                  className={`pointer-events-none absolute inset-x-0 top-full mt-3 line-clamp-2 text-sm leading-snug text-gray-500 transition-opacity ${
                    hasActiveSearch ? "opacity-100" : "opacity-0"
                  }`}
                  aria-live="polite"
                >
                  {searchFeedback || "\u00a0"}
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className="relative h-[46%] min-h-[220px] overflow-hidden bg-oxford-dark">
          <img
            src={HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover animate-hero-image-zoom"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>
      </section>

      {/* Browse by subject — below hero image */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Browse
              </p>
              <h2 className="mt-1 font-serif text-3xl font-bold tracking-wide text-black md:text-4xl">
                By subject
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
                Explore economics journal subject categories across theory, applied fields, and policy.
              </p>
            </div>
            <Link
              to={routes.topics}
              className="inline-flex shrink-0 items-center gap-2 border border-gray-900 bg-gray-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Journal A to Z
              <span aria-hidden>→</span>
            </Link>
          </div>

          <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {JOURNAL_SUBJECTS.map((subject) => {
              const isActive = selectedTopic === subject;
              return (
                <li key={subject}>
                  <button
                    type="button"
                    onClick={() => selectSubject(subject)}
                    className={`group flex w-full items-center justify-between border-b py-3.5 text-left text-sm transition-colors ${
                      isActive
                        ? "border-gray-900 text-gray-900"
                        : "border-gray-200 text-gray-700 hover:border-gray-400 hover:text-gray-950"
                    }`}
                  >
                    <span className="font-medium">{subject}</span>
                    <span
                      aria-hidden
                      className={`text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500 ${
                        isActive ? "text-gray-700" : ""
                      }`}
                    >
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section
        ref={resultsRef}
        id="journal-results"
        className="bg-white px-6 py-20 md:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Reading
              </p>
              <h2 className="mt-1 font-serif text-3xl font-bold tracking-wide text-black md:text-4xl">
                {selectedTopic === "All" ? "Latest articles" : selectedTopic}
              </h2>
            </div>
            {selectedTopic !== "All" && (
              <button
                type="button"
                onClick={() => setSelectedTopic("All")}
                className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline"
              >
                Clear subject filter
              </button>
            )}
          </div>

          {featuredArticle && (
            <Link
              to={routes.article(featuredArticle.id)}
              className="group mb-12 block border-b border-gray-200 pb-12"
            >
              <article>
                <div className="mb-6 overflow-hidden">
                  <img
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    className="h-[360px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] md:h-[420px]"
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 max-w-4xl space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <img
                        src={featuredArticle.authorAvatar}
                        alt={featuredArticle.author}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="font-medium text-gray-900">{featuredArticle.author}</span>
                      <span className="text-gray-300">·</span>
                      <span>{featuredArticle.date}</span>
                      <span className="text-gray-300">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {featuredArticle.readTime} min read
                      </span>
                    </div>
                    <h3 className="font-serif text-3xl font-bold leading-tight tracking-wide text-black transition-opacity group-hover:opacity-70 md:text-4xl">
                      {featuredArticle.title}
                    </h3>
                    <p className="text-lg leading-relaxed text-gray-600">
                      {featuredArticle.excerpt}
                    </p>
                    <p className="text-sm font-medium text-gray-700">{featuredArticle.category}</p>
                  </div>
                  <span
                    aria-hidden
                    className="mt-2 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                  >
                    →
                  </span>
                </div>
              </article>
            </Link>
          )}

          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {regularArticles.length === 0 && filteredPublishedArticles.length === 0 && (
                <div className="border-b border-gray-200 py-10">
                  <Search className="mb-3 h-6 w-6 text-gray-400" />
                  <p className="font-medium text-gray-900">No articles found</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Try a different search term, author name, DOI, or subject.
                  </p>
                </div>
              )}

              <ul>
                {regularArticles.map((article) => (
                  <li key={article.id}>
                    <Link
                      to={routes.article(article.id)}
                      className="group flex items-start justify-between gap-4 border-b border-gray-200 py-6 transition-colors hover:border-gray-400"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          <img
                            src={article.authorAvatar}
                            alt={article.author}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                          <span>{article.author}</span>
                          <span className="text-gray-300">·</span>
                          <span>{article.date}</span>
                        </div>
                        <h3 className="font-serif text-xl font-bold leading-snug tracking-wide text-black transition-opacity group-hover:opacity-70 md:text-2xl">
                          {article.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
                          {article.excerpt}
                        </p>
                        <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                          <span className="font-medium text-gray-700">{article.category}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {article.readTime} min
                          </span>
                        </div>
                      </div>
                      <img
                        src={article.image}
                        alt=""
                        className="h-24 w-24 shrink-0 object-cover md:h-32 md:w-36"
                      />
                      <span
                        aria-hidden
                        className="mt-1 hidden shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500 sm:block"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <JournalSidebar align="right" />
          </div>
        </div>
      </section>

      <PublishedArticlesSection searchQuery={searchQuery} selectedTopic={selectedTopic} />
    </PublicJournalLayout>
  );
};

export default Journal;
