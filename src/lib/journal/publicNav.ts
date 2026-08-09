import { routes } from "@/app/routes";

export interface PublicNavItem {
  name: string;
  path: string;
}

export interface SidebarLink {
  label: string;
  path: string;
  external?: boolean;
  /** Shown on downloadable template links, e.g. DOCX or PDF. */
  fileType?: string;
  /** Optional size label, e.g. "42 KB". */
  fileSize?: string;
}

/** Header nav for the public journal site. */
export const PUBLIC_HEADER_NAV: PublicNavItem[] = [
  { name: "Home", path: routes.home },
  { name: "About", path: routes.about },
  { name: "Current", path: routes.current },
  { name: "Archives", path: routes.archives },
  { name: "Announcements", path: routes.announcements },
  { name: "Editorial Team", path: routes.editorialTeam },
];

export const EDITORIAL_POLICY_LINKS: SidebarLink[] = [
  { label: "Author Guidelines", path: routes.policy("author-guidelines") },
  { label: "Peer Review Process", path: routes.policy("peer-review-process") },
  { label: "Aims and Scope", path: routes.policy("aims-and-scope") },
  { label: "Authorship", path: routes.policy("authorship") },
  { label: "Publication Ethics", path: routes.policy("publication-ethics") },
  { label: "Copyright Notice", path: routes.policy("copyright-notice") },
  { label: "Open Access Policy", path: routes.policy("open-access-policy") },
  { label: "Conflicts of Interest", path: routes.policy("conflicts-of-interest") },
  { label: "Correction or Retraction", path: routes.policy("correction-or-retraction") },
  { label: "Complaints Process", path: routes.policy("complaints-process") },
  { label: "Plagiarism Checker", path: routes.policy("plagiarism-checker") },
  { label: "Fees", path: routes.policy("fees") },
  { label: "Accreditation", path: routes.policy("accreditation") },
];

export const INFORMATION_LINKS: SidebarLink[] = [
  { label: "For Readers", path: routes.information("readers") },
  { label: "For Authors", path: routes.information("authors") },
  { label: "For Librarians", path: routes.information("librarians") },
];

export const TEMPLATE_LINKS: SidebarLink[] = [
  {
    label: "Article manuscript template",
    path: "https://docs.google.com/document/d/placeholder-article-template",
    external: true,
    fileType: "DOCX",
    fileSize: "48 KB",
  },
  {
    label: "Title page template",
    path: "https://docs.google.com/document/d/placeholder-title-page",
    external: true,
    fileType: "DOCX",
    fileSize: "24 KB",
  },
];

export const ACCREDITATION_LINK: SidebarLink = {
  label: "View journal indexing profile",
  path: "https://example.com/journal-indexing",
  external: true,
};

export const BROWSE_LINKS: SidebarLink[] = [
  { label: "By Issue", path: routes.archives },
];

/** Footer link groups for the public journal site. */
export const FOOTER_JOURNAL_LINKS: PublicNavItem[] = [
  ...PUBLIC_HEADER_NAV,
  { name: "Search", path: routes.search },
  { name: "Topics A–Z", path: routes.topics },
];

export const FOOTER_POLICY_LINKS: SidebarLink[] = [
  { label: "Author Guidelines", path: routes.policy("author-guidelines") },
  { label: "Peer Review Process", path: routes.policy("peer-review-process") },
  { label: "Aims and Scope", path: routes.policy("aims-and-scope") },
  { label: "Open Access Policy", path: routes.policy("open-access-policy") },
  { label: "Publication Ethics", path: routes.policy("publication-ethics") },
  { label: "Fees", path: routes.policy("fees") },
];

export const FOOTER_SUBMIT_LINKS: PublicNavItem[] = [
  { name: "Sign In", path: routes.signin },
  { name: "Get Started", path: routes.register },
];

export const FOOTER_META = {
  printIssn: "1234-5678",
  onlineIssn: "8765-4321",
  publisher: "TUES University Press",
  editorialEmail: "edit@tues.example",
  tagline: "Research, commentary, and analysis in economics and finance.",
} as const;

export function isPublicNavActive(pathname: string, path: string): boolean {
  if (path === routes.home) {
    return pathname === routes.home;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}
