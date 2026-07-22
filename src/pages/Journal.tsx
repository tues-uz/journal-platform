import JournalHeader from "@/components/JournalHeader";
import Footer from "@/components/Footer";
import { PublishedArticlesSection } from "@/components/landing/PublishedArticlesSection";
import {
  Clock,
  Bookmark,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { routes } from "@/app/routes";
import { filterLandingArticles, LANDING_ARTICLES } from "@/lib/landing/articles";
import { Input } from "@/components/ui/input";
import { publicArticlesApi } from "@/lib/api/publicArticles";
import { matchesPublicArticleSearch, matchesPublicArticleTopic } from "@/lib/store/publicArticles";

const Journal = () => {
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const topics = [
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

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const { data: publishedArticles = [] } = useQuery({
    queryKey: ["public-articles"],
    queryFn: () => publicArticlesApi.list(),
  });

  const filteredArticles = useMemo(
    () => filterLandingArticles(LANDING_ARTICLES, searchQuery, selectedTopic),
    [searchQuery, selectedTopic],
  );

  const filteredPublishedArticles = useMemo(
    () =>
      publishedArticles.filter(
        (article) =>
          matchesPublicArticleTopic(article, selectedTopic) &&
          matchesPublicArticleSearch(article, searchQuery),
      ),
    [publishedArticles, searchQuery, selectedTopic],
  );

  const featuredArticle = filteredArticles.find((a) => a.featured);
  const regularArticles = filteredArticles.filter((a) => !a.featured);
  const discoverMoreArticles = filteredArticles.filter((a) => [9, 10, 11].includes(a.id));
  const hasActiveSearch = searchQuery.trim().length > 0;
  const totalSearchResults = filteredArticles.length + filteredPublishedArticles.length;

  return (
    <div className="min-h-screen bg-white">
      <JournalHeader />

      <main className="pt-24 pb-16">
        {/* Hero Section - Medium Style */}
        <section className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
                TUES Economics Journal
              </h1>
              <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Research, commentary, and analysis from economists, scholars, and policy thinkers
              </p>

              <div className="mt-8 max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search articles, authors, and author submissions..."
                    aria-label="Search journal articles"
                    className="h-12 rounded-full border-gray-300 bg-white pl-12 pr-4 text-base shadow-sm focus-visible:ring-gray-400"
                  />
                </div>
                {hasActiveSearch && (
                  <p className="mt-3 text-sm text-gray-500">
                    {totalSearchResults === 0
                      ? "No articles or author submissions match your search."
                      : `${totalSearchResults} result${totalSearchResults === 1 ? "" : "s"} found${
                          filteredPublishedArticles.length > 0
                            ? ` (${filteredPublishedArticles.length} published submission${
                                filteredPublishedArticles.length === 1 ? "" : "s"
                              })`
                            : ""
                        }`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Topic Filter Bar - Medium Style */}
        <section className="border-b border-gray-200 bg-white sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="relative flex items-center">
              {/* Scroll Left Button */}
              <button
                onClick={scrollLeft}
                className="absolute left-0 z-10 bg-white/80 backdrop-blur-sm p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              {/* Scrollable Topics */}
              <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 px-8"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {/* Explore Topics Button */}
                <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    height="20"
                    width="20"
                    className="text-gray-600"
                  >
                    <circle cx="12" cy="12.001" r="10.5" stroke="currentColor"></circle>
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="m16.083 6.167-.147.989-.984 6.636-.036.247-.22.119-5.899 3.194-.88.476.147-.989.984-6.635.037-.248.22-.119 5.899-3.194zM9.92 11.15 9.2 15.997l4.308-2.333zm4.163 1.695-3.59-2.514L14.8 8z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Explore topics</span>
                </button>

                {/* Topic Buttons */}
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      selectedTopic === topic
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Scroll Right Button */}
              <button
                onClick={scrollRight}
                className="absolute right-0 z-10 bg-white/80 backdrop-blur-sm p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </section>

        {/* Featured Article */}
        {featuredArticle && (
          <section className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="max-w-4xl mx-auto">
                <Link
                  to={routes.article(featuredArticle.id)}
                  className="block cursor-pointer group"
                >
                  <article>
                  <div className="mb-6">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-[400px] object-cover rounded-lg"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={featuredArticle.authorAvatar}
                          alt={featuredArticle.author}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {featuredArticle.author}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-600">{featuredArticle.date}</span>
                      <span className="text-gray-400">·</span>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{featuredArticle.readTime} min read</span>
                      </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {featuredArticle.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {featuredArticle.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <Bookmark className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <Share2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  </article>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Articles Grid - Medium Style */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Articles Column */}
              <div className="lg:col-span-2 space-y-8">
                {regularArticles.length === 0 && filteredPublishedArticles.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                    <Search className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                    <p className="text-lg font-medium text-gray-900">No articles found</p>
                    <p className="mt-2 text-gray-600">
                      Try a different search term, author name, or clear the topic filter.
                    </p>
                  </div>
                )}
                {regularArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={routes.article(article.id)}
                    className="block cursor-pointer group border-b border-gray-200 pb-8 last:border-0"
                  >
                    <article>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={article.authorAvatar}
                            alt={article.author}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-sm text-gray-600">{article.author}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-sm text-gray-500">{article.date}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-gray-700 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-3 leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {article.category}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{article.readTime} min</span>
                            </div>
                          </div>
                          <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                            <Bookmark className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-32 h-32 md:w-40 md:h-40 object-cover rounded"
                        />
                      </div>
                    </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="sticky top-24 space-y-8">
                  {/* Discover More */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                      Discover more
                    </h3>
                    <div className="space-y-4">
                      {discoverMoreArticles.map((article) => (
                        <Link
                          key={article.id}
                          to={routes.article(article.id)}
                          className="flex items-start gap-3 cursor-pointer group"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2">
                              {article.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{article.readTime} min read</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Call for Papers */}
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                      Call for Papers
                    </h3>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Special Issue: Service Economies in a Digital World
                    </h4>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      TUES Economics Journal invites submissions on topics including digital platforms, gig work,
                      tourism, and education services.
                    </p>
                    <Link
                      to={routes.register}
                      className="block w-full px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors text-center"
                    >
                      Submit your manuscript
                    </Link>
                  </div>

                  {/* Author Spotlight */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                      Author Spotlight
                    </h3>
                    <div className="flex items-start gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80"
                        alt="Dr. Dilshod Karimov"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Research Chair</p>
                        <p className="text-sm font-bold text-gray-900">Dr. Dilshod Karimov</p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          Connecting macroeconomic models with on‑the‑ground evidence from border regions and logistics hubs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <PublishedArticlesSection searchQuery={searchQuery} selectedTopic={selectedTopic} />
      </main>

      <Footer />
    </div>
  );
};

export default Journal;
