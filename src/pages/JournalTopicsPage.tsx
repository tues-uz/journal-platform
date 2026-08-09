import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PublicJournalLayout from "@/components/layout/PublicJournalLayout";
import { PublicBreadcrumb } from "@/components/JournalSidebar";
import { getSubjectsAZ } from "@/lib/journal/subjects";
import { routes } from "@/app/routes";

function groupByLetter(subjects: string[]): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const subject of subjects) {
    const letter = subject.charAt(0).toUpperCase();
    const list = groups.get(letter) ?? [];
    list.push(subject);
    groups.set(letter, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function letterNavClass(isActive: boolean) {
  return `px-2 py-1 text-sm transition-colors ${
    isActive
      ? "font-semibold text-black"
      : "font-medium text-gray-300 hover:text-gray-500"
  }`;
}

/** Fixed header (64px) + sticky letter nav when scrolling */
const AZ_SCROLL_OFFSET = 120;
const STICKY_NAV_TOP_CLASS = "top-16";

function scrollToAzTarget(targetId: string, behavior: ScrollBehavior = "smooth") {
  const el = document.getElementById(targetId);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - AZ_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior });
  window.history.replaceState(null, "", `#${targetId}`);
}

const JournalTopicsPage = () => {
  const [activeHash, setActiveHash] = useState(() => window.location.hash);
  const letterGroups = groupByLetter(getSubjectsAZ());
  const allActive = !activeHash || activeHash === "#journal-a-z-all";

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    requestAnimationFrame(() => scrollToAzTarget(hash, "auto"));
  }, []);

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    scrollToAzTarget(targetId);
    setActiveHash(`#${targetId}`);
  };

  return (
    <PublicJournalLayout>
      <div>
        <PublicBreadcrumb items={[{ label: "Journal A to Z" }]} />
        <h1 className="mb-2 font-serif text-3xl font-bold tracking-wide text-black md:text-4xl">
          Journal A to Z
        </h1>
        <p className="mb-10 max-w-2xl text-sm leading-relaxed text-gray-600">
          Browse the full subject index for TUES Economics Journal, listed alphabetically.
        </p>

        <nav
          aria-label="Browse subjects by letter"
          className={`sticky ${STICKY_NAV_TOP_CLASS} z-40 -mx-1 mb-10 flex flex-wrap gap-2 border-b border-gray-200 bg-white/95 px-1 py-4 pb-6 backdrop-blur-sm`}
        >
          <a
            href="#journal-a-z-all"
            onClick={(event) => handleNavClick(event, "journal-a-z-all")}
            className={`${letterNavClass(allActive)} tracking-wide uppercase`}
            aria-current={allActive ? "location" : undefined}
          >
            All
          </a>
          {letterGroups.map(([letter]) => {
            const isActive = activeHash === `#letter-${letter}`;
            const targetId = `letter-${letter}`;
            return (
              <a
                key={letter}
                href={`#${targetId}`}
                onClick={(event) => handleNavClick(event, targetId)}
                className={letterNavClass(isActive)}
                aria-current={isActive ? "location" : undefined}
              >
                {letter}
              </a>
            );
          })}
        </nav>

        <div id="journal-a-z-all" className="scroll-mt-32 space-y-10">
          {letterGroups.map(([letter, subjects]) => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-32">
              <h2 className="mb-3 font-serif text-2xl font-bold tracking-wide text-black">
                {letter}
              </h2>
              <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <li key={subject}>
                    <Link
                      to={`${routes.home}?topic=${encodeURIComponent(subject)}#journal-results`}
                      className="group flex items-center justify-between border-b border-gray-200 py-3 text-sm text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-950"
                    >
                      <span className="font-medium">{subject}</span>
                      <span
                        aria-hidden
                        className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </PublicJournalLayout>
  );
};

export default JournalTopicsPage;
