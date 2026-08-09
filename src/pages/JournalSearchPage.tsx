import { Link } from "react-router-dom";
import { ChevronDown, Clock, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PublicJournalLayout from "@/components/layout/PublicJournalLayout";
import { PublicBreadcrumb } from "@/components/JournalSidebar";
import { routes } from "@/app/routes";
import {
  JOURNAL_TOPICS,
  SEARCH_SCOPES,
  useJournalSearch,
  type SearchScope,
} from "@/lib/journal/useJournalSearch";
import { formatPublicArticleDate } from "@/lib/store/publicArticles";

const PUBLISHED_GRADIENTS = [
  "from-slate-800 to-slate-600",
  "from-emerald-900 to-emerald-700",
  "from-stone-800 to-stone-600",
  "from-teal-900 to-teal-700",
  "from-zinc-800 to-zinc-600",
];

const FILTER_PANEL_WIDTH = 320;

interface FilterDropdownOption {
  value: string;
  label: string;
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <div ref={rootRef} className="relative">
      <span className="font-serif text-base font-bold tracking-wide text-black">{label}</span>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex h-10 w-full items-center justify-between rounded-none border border-gray-300 bg-white px-3 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:border-black focus:outline-none"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-full z-[1] mt-1 max-h-48 overflow-y-auto border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                    isSelected ? "bg-gray-50 font-medium text-black" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SearchFiltersPanel({
  scope,
  selectedTopic,
  hasActiveFilters,
  onClear,
  onScopeChange,
  onTopicChange,
}: {
  scope: SearchScope;
  selectedTopic: string;
  hasActiveFilters: boolean;
  onClear: () => void;
  onScopeChange: (scope: SearchScope) => void;
  onTopicChange: (topic: string) => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Filter</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-5 space-y-5">
        <FilterDropdown
          label="Search scope"
          ariaLabel="Search scope"
          value={scope}
          options={SEARCH_SCOPES}
          onChange={(value) => onScopeChange(value as SearchScope)}
        />
        <FilterDropdown
          label="By subject"
          ariaLabel="Subject filter"
          value={selectedTopic}
          options={JOURNAL_TOPICS.map((topic) => ({ value: topic, label: topic }))}
          onChange={onTopicChange}
        />
      </div>
    </>
  );
}

const JournalSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [scope, setScope] = useState<SearchScope>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLElement>(null);
  const [filterPanelPosition, setFilterPanelPosition] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  useEffect(() => {
    if (!filtersOpen || !filterAnchorRef.current) {
      setFilterPanelPosition(null);
      return;
    }

    function updatePosition() {
      const anchor = filterAnchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const width = Math.min(FILTER_PANEL_WIDTH, window.innerWidth - 24);

      setFilterPanelPosition({
        top: rect.bottom + 8,
        left: Math.max(12, rect.right - width),
        width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (!filtersOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (
        filterAnchorRef.current?.contains(target as Node) ||
        filterPanelRef.current?.contains(target as Node)
      ) {
        return;
      }
      setFiltersOpen(false);
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [filtersOpen]);

  const { filteredArticles, filteredPublishedArticles, totalResults, hasActiveSearch, hasActiveFilters } =
    useJournalSearch(searchQuery, selectedTopic, scope);

  const hasActiveQuery = hasActiveSearch || hasActiveFilters;

  const searchFeedback = hasActiveQuery
    ? totalResults === 0
      ? "No articles match your search."
      : `${totalResults} result${totalResults === 1 ? "" : "s"} found`
    : "";

  return (
    <PublicJournalLayout>
      <div>
        <PublicBreadcrumb items={[{ label: "Search" }]} />

        <div className="relative z-30 mb-12">
          <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Search</p>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-wide text-black md:text-4xl">
            Find articles
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
            Search by author, DOI, title, keyword, or subject.
          </p>

          <div className="mt-8">
            <form
              className="relative max-w-xl lg:max-w-none"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <div className="group flex items-center gap-3 border-b border-gray-900/15 pb-3 transition-colors focus-within:border-oxford-blue">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Search
                    className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-focus-within:text-oxford-blue"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Author name, DOI, or keyword"
                    aria-label="Search journal content"
                    className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm leading-none text-gray-900 outline-none placeholder:text-gray-400 [appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden md:text-base"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-none bg-journal-teal px-5 py-2.5 text-sm font-medium leading-none text-white transition-colors hover:bg-journal-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-journal-teal/40 focus-visible:ring-offset-2"
                >
                  Search
                </button>
                <div ref={filterAnchorRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFiltersOpen((open) => !open);
                    }}
                    aria-expanded={filtersOpen}
                    aria-controls="search-filters"
                    className={`rounded-none border px-4 py-2.5 text-sm font-medium leading-none transition-colors ${
                      filtersOpen || hasActiveFilters
                        ? "border-black bg-black text-white"
                        : "border-gray-300 text-gray-700 hover:border-black hover:bg-black hover:text-white"
                    }`}
                  >
                    Filter
                  </button>
                </div>
              </div>
              <p
                className={`pointer-events-none absolute inset-x-0 top-full mt-3 line-clamp-2 text-sm leading-snug text-gray-500 transition-opacity ${
                  hasActiveQuery ? "opacity-100" : "opacity-0"
                }`}
                aria-live="polite"
              >
                {searchFeedback || "\u00a0"}
              </p>
            </form>
          </div>
        </div>

        {filtersOpen &&
          filterPanelPosition &&
          createPortal(
            <aside
              ref={filterPanelRef}
              id="search-filters"
              style={{
                top: filterPanelPosition.top,
                left: filterPanelPosition.left,
                width: filterPanelPosition.width,
              }}
              className="fixed z-[200] border border-gray-200 bg-white p-5 shadow-lg"
            >
              <SearchFiltersPanel
                scope={scope}
                selectedTopic={selectedTopic}
                hasActiveFilters={hasActiveFilters}
                onClear={() => {
                  setSelectedTopic("All");
                  setScope("all");
                }}
                onScopeChange={setScope}
                onTopicChange={setSelectedTopic}
              />
            </aside>,
            document.body,
          )}

        <div className="relative z-0">
          <div className="mb-8">
            <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Results</p>
            <h2 className="mt-1 font-serif text-3xl font-bold tracking-wide text-black md:text-4xl">
              {selectedTopic === "All" ? "All articles" : selectedTopic}
            </h2>
          </div>

          {hasActiveQuery && totalResults === 0 && (
            <div className="border-b border-gray-200 py-10">
              <Search className="mb-3 h-6 w-6 text-gray-400" />
              <p className="font-medium text-gray-900">No articles found</p>
              <p className="mt-2 text-sm text-gray-600">
                Try a different search term, scope, or subject.
              </p>
            </div>
          )}

          {filteredArticles.length > 0 && (
            <ul className="mb-12">
              {filteredArticles.map((article) => (
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
          )}

          {filteredPublishedArticles.length > 0 && (
            <div>
              <p className="mb-6 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Published submissions
              </p>
              <ul className="grid gap-x-8 gap-y-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredPublishedArticles.map((article, index) => (
                  <li key={article.id}>
                    <Link
                      to={routes.article(article.id)}
                      className="group flex h-full flex-col border-b border-gray-200 py-5 transition-colors hover:border-gray-400"
                    >
                      <div
                        className={`mb-4 h-44 w-full bg-gradient-to-br md:h-52 ${PUBLISHED_GRADIENTS[index % PUBLISHED_GRADIENTS.length]}`}
                      />
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{article.category}</span>
                        <span className="mx-1.5 text-gray-300">·</span>
                        {formatPublicArticleDate(article.publishedAt)}
                        {article.volumeIssueLabel && (
                          <>
                            <span className="mx-1.5 text-gray-300">·</span>
                            {article.volumeIssueLabel}
                          </>
                        )}
                      </p>
                      <h4 className="mt-1.5 flex-1 font-serif text-lg font-bold leading-snug tracking-wide text-black transition-opacity group-hover:opacity-70">
                        {article.title}
                      </h4>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
                        {article.excerpt}
                      </p>
                      <p className="mt-3 text-sm text-gray-500">
                        {article.author}
                        <span
                          aria-hidden
                          className="ml-3 inline-block text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                        >
                          →
                        </span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </PublicJournalLayout>
  );
};

export default JournalSearchPage;
