export interface StaticSection {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface StaticPageMeta {
  label: string;
  value: string;
}

export interface StaticPageContent {
  title: string;
  breadcrumb?: string[];
  kicker?: string;
  /** Optional editorial image shown in the page masthead. */
  image?: string;
  imageAlt?: string;
  /** Compact facts shown in a meta strip (ISSN, publisher, etc.). */
  meta?: StaticPageMeta[];
  sections: StaticSection[];
}

export interface TocArticle {
  title: string;
  authors: string;
  pages: string;
  pdfHref?: string;
}

export interface StaticIssue {
  label: string;
  doi?: string;
  sectionTitle: string;
  articles: TocArticle[];
}

export interface ArchiveVolume {
  volume: number;
  year: number;
  issues: { label: string; href: string }[];
}

export interface Announcement {
  id: string;
  date: string;
  title: string;
  excerpt: string;
  body: string[];
}

export interface EditorialMember {
  name: string;
  role: string;
  affiliation: string;
  email?: string;
}

const JOURNAL = "TUES Economics Journal";

function page(
  title: string,
  sections: StaticSection[],
  breadcrumb?: string[],
  extras?: {
    src?: string;
    alt?: string;
    kicker?: string;
    meta?: StaticPageMeta[];
  },
): StaticPageContent {
  return {
    title,
    breadcrumb,
    sections,
    image: extras?.src,
    imageAlt: extras?.alt,
    kicker: extras?.kicker,
    meta: extras?.meta,
  };
}

const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";
const POLICY_IMAGE =
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80";
const INFORMATION_IMAGE =
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80";

export const POLICY_SLUGS = [
  "author-guidelines",
  "peer-review-process",
  "aims-and-scope",
  "authorship",
  "publication-ethics",
  "copyright-notice",
  "open-access-policy",
  "conflicts-of-interest",
  "correction-or-retraction",
  "complaints-process",
  "plagiarism-checker",
  "fees",
  "accreditation",
] as const;

export type PolicySlug = (typeof POLICY_SLUGS)[number];

export const INFORMATION_SLUGS = ["readers", "authors", "librarians"] as const;
export type InformationSlug = (typeof INFORMATION_SLUGS)[number];

export const POLICY_PAGES: Record<PolicySlug, StaticPageContent> = {
  "author-guidelines": page("Author Guidelines", [
    {
      paragraphs: [
        `${JOURNAL} welcomes original research articles, review papers, and policy briefs in economics and related fields. Manuscripts should be submitted through the online submission system after registering an author account.`,
      ],
    },
    {
      heading: "Manuscript preparation",
      paragraphs: [
        "Prepare a blinded manuscript (no author names in the main text), a separate title page with full author affiliations and ORCID iDs, and all figures and tables as separate files where applicable.",
      ],
      bullets: [
        "Maximum 8,000 words for research articles (excluding references)",
        "Abstract of 150–250 words with 4–6 keywords",
        "References in APA 7th edition style",
        "Line numbering and page numbers required for review copies",
      ],
    },
    {
      heading: "Submission steps",
      paragraphs: [
        "Complete all wizard steps: metadata, authors, required files, and final review before submitting. Incomplete submissions remain in draft status and are not sent to the editorial office.",
      ],
    },
  ], ["Editorial Policies", "Author Guidelines"]),

  "peer-review-process": page("Peer Review Process", [
    {
      paragraphs: [
        `${JOURNAL} uses double-blind peer review. Handling editors manage reviewer invitations; the Editor-in-Chief oversees editorial policy but does not assign reviewers at intake.`,
      ],
    },
    {
      heading: "Review stages",
      paragraphs: [],
      bullets: [
        "Initial screening by the handling editor",
        "Minimum of two independent external reviewers",
        "Editorial decision: accept, minor/major revision, or reject",
        "Author revision and re-review when required",
        "Final approval before production and publication",
      ],
    },
    {
      heading: "Reviewer responsibilities",
      paragraphs: [
        "Reviewers evaluate originality, methodology, clarity, and contribution to the field. Conflicts of interest must be declared and invitations declined when appropriate.",
      ],
    },
  ], ["Editorial Policies", "Peer Review Process"]),

  "aims-and-scope": page("Aims and Scope", [
    {
      paragraphs: [
        `${JOURNAL} publishes rigorous economic research with relevance to policy, development, and academic discourse. We encourage empirical, theoretical, and interdisciplinary work that advances understanding of markets, institutions, and human behavior.`,
      ],
    },
    {
      heading: "Topics of interest",
      paragraphs: [],
      bullets: [
        "Macroeconomics and monetary policy",
        "Microeconomics and industrial organization",
        "Development and international economics",
        "Behavioral and experimental economics",
        "Public policy and fiscal analysis",
        "Financial markets and banking",
      ],
    },
  ], ["Editorial Policies", "Aims and Scope"]),

  authorship: page("Authorship", [
    {
      paragraphs: [
        "All listed authors must have made substantial contributions to the work and approved the final manuscript. Guest or honorary authorship is not permitted.",
      ],
    },
    {
      heading: "Corresponding author",
      paragraphs: [
        "One corresponding author must be designated to handle communication with the editorial office throughout review and production.",
      ],
    },
    {
      heading: "Changes to authorship",
      paragraphs: [
        "Changes after submission require written agreement from all authors and editorial approval before acceptance.",
      ],
    },
  ], ["Editorial Policies", "Authorship"]),

  "publication-ethics": page("Publication Ethics", [
    {
      paragraphs: [
        `${JOURNAL} follows COPE guidelines on publication ethics, including duties of authors, reviewers, and editors.`,
      ],
      bullets: [
        "No fabrication, falsification, or plagiarism",
        "Proper citation of prior work and data sources",
        "Disclosure of funding and competing interests",
        "Human subjects research must comply with institutional ethics approval",
      ],
    },
  ], ["Editorial Policies", "Publication Ethics"]),

  "copyright-notice": page("Copyright Notice", [
    {
      paragraphs: [
        "Authors retain copyright of their published work under the journal's open access license. By submitting, authors grant the journal a license to publish and distribute the article.",
      ],
    },
    {
      heading: "Third-party content",
      paragraphs: [
        "Authors are responsible for obtaining permission to reproduce copyrighted material from other sources.",
      ],
    },
  ], ["Editorial Policies", "Copyright Notice"]),

  "open-access-policy": page("Open Access Policy", [
    {
      paragraphs: [
        `${JOURNAL} provides immediate open access to all published content. Articles are freely available to read, download, and share with proper attribution.`,
      ],
    },
    {
      heading: "License",
      paragraphs: [
        "Published articles are distributed under Creative Commons Attribution (CC BY) unless otherwise stated at acceptance.",
      ],
    },
  ], ["Editorial Policies", "Open Access Policy"]),

  "conflicts-of-interest": page("Conflicts of Interest", [
    {
      paragraphs: [
        "Authors, reviewers, and editors must disclose financial, personal, or professional relationships that could influence the work or its evaluation.",
      ],
    },
    {
      heading: "Editorial handling",
      paragraphs: [
        "Editors with a conflict recuse themselves from decisions on affected manuscripts and assign alternative handling editors when needed.",
      ],
    },
  ], ["Editorial Policies", "Conflicts of Interest"]),

  "correction-or-retraction": page("Correction or Retraction", [
    {
      paragraphs: [
        "The journal publishes corrections for errors that affect the interpretation of the article. Retractions are issued for serious issues such as plagiarism, unreliable data, or ethical violations.",
      ],
    },
    {
      heading: "Process",
      paragraphs: [
        "Corrections and retractions are published with a clear link to the original article and an explanation of the change.",
      ],
    },
  ], ["Editorial Policies", "Correction or Retraction"]),

  "complaints-process": page("Complaints Process", [
    {
      paragraphs: [
        "Complaints about editorial decisions, peer review, or publication ethics should be sent to the editorial office with supporting documentation.",
      ],
    },
    {
      heading: "Resolution",
      paragraphs: [
        "The Editor-in-Chief or an appointed ethics officer investigates complaints and responds within 30 business days. Appeals follow COPE guidance where applicable.",
      ],
    },
  ], ["Editorial Policies", "Complaints Process"]),

  "plagiarism-checker": page("Plagiarism Checker", [
    {
      paragraphs: [
        "All submissions are screened with similarity-detection software at submission and before final acceptance. High similarity scores trigger editorial review.",
      ],
    },
    {
      heading: "Author responsibility",
      paragraphs: [
        "Authors must ensure proper paraphrasing and citation. Self-plagiarism of previously published work without disclosure may result in rejection.",
      ],
    },
  ], ["Editorial Policies", "Plagiarism Checker"]),

  fees: page("Fees", [
    {
      paragraphs: [
        `${JOURNAL} does not charge submission fees. An article processing charge (APC) applies after editorial acceptance and before production.`,
      ],
    },
    {
      heading: "APC",
      paragraphs: [],
      bullets: [
        "Standard research article: USD 150 (waivers available on request)",
        "Payment is requested after handling editor approval for publication",
        "Proof of bank transfer is reviewed by the publisher before layout begins",
      ],
    },
  ], ["Editorial Policies", "Fees"]),

  accreditation: page("Accreditation", [
    {
      paragraphs: [
        `${JOURNAL} is indexed in selected regional and subject databases and maintains transparent editorial standards aligned with international best practices.`,
      ],
    },
    {
      heading: "Indexing",
      paragraphs: [
        "Indexing applications are updated annually. Librarians and authors may contact the editorial office for the current list of indexing partners.",
      ],
    },
  ], ["Editorial Policies", "Accreditation"]),
};

export const INFORMATION_PAGES: Record<InformationSlug, StaticPageContent> = {
  readers: page("For Readers", [
    {
      paragraphs: [
        `${JOURNAL} offers free access to all published articles. Browse the current issue, archives, or search by author, title, or keyword.`,
      ],
    },
    {
      heading: "How to cite",
      paragraphs: [
        "Use the DOI displayed on each article page. Export citation metadata is available from the article landing page.",
      ],
    },
  ], ["Information", "For Readers"]),

  authors: page("For Authors", [
    {
      paragraphs: [
        "Register for an author account to submit manuscripts. Review the Author Guidelines and Fees pages before starting a submission.",
      ],
      bullets: [
        "Create an account at Get Started",
        "Prepare blinded manuscript and title page files",
        "Track submission status in your author dashboard",
        "Pay APC only after editorial acceptance",
      ],
    },
  ], ["Information", "For Authors"]),

  librarians: page("For Librarians", [
    {
      paragraphs: [
        `${JOURNAL} is an open-access journal. No subscription is required. Librarians may include the journal in discovery systems using the ISSN and DOI prefix listed on the About page.`,
      ],
    },
    {
      heading: "Metadata",
      paragraphs: [
        "Article-level metadata and DOIs are registered at publication. Contact the publisher for bulk metadata exports or archiving agreements.",
      ],
    },
  ], ["Information", "For Librarians"]),
};

export const ABOUT_PAGE: StaticPageContent = page(
  "About the Journal",
  [
    {
      paragraphs: [
        `${JOURNAL} is a peer-reviewed open-access journal publishing research, commentary, and policy analysis in economics and related disciplines—with a particular focus on Central Asia and emerging economies.`,
        "We welcome empirical studies, theoretical work, and policy briefs that speak to scholars, practitioners, and public audiences alike.",
      ],
    },
    {
      heading: "What we publish",
      paragraphs: [
        "Each issue brings together rigorous peer-reviewed articles across core and applied economics.",
      ],
      bullets: [
        "Original research articles and review papers",
        "Policy analysis and commentary",
        "Special issues on regional and thematic priorities",
      ],
    },
    {
      heading: "Editorial approach",
      paragraphs: [
        "Submissions undergo double-blind peer review managed by handling editors. We aim for clear decisions, constructive feedback, and timely production after acceptance.",
      ],
    },
    {
      heading: "Get in touch",
      paragraphs: [
        "For submissions and editorial inquiries, use the online submission system. For technical support, contact support@tuesjournal.example.",
      ],
    },
  ],
  ["About"],
  {
    src: ABOUT_IMAGE,
    alt: "Editorial workspace at TUES Economics Journal",
    kicker: "Who we are",
    meta: [
      { label: "Print ISSN", value: "1234-5678" },
      { label: "Online ISSN", value: "8765-4321" },
      { label: "Publisher", value: "TUES University Press" },
      { label: "Editorial", value: "edit@tues.example" },
    ],
  },
);

/** Defaults used when a static page does not define its own image. */
export const STATIC_PAGE_IMAGES = {
  policy: POLICY_IMAGE,
  information: INFORMATION_IMAGE,
  about: ABOUT_IMAGE,
  default: ABOUT_IMAGE,
} as const;

export const ARCHIVE_VOLUMES: ArchiveVolume[] = [
  {
    volume: 3,
    year: 2026,
    issues: [
      { label: "Vol. 3, No. 2 (2026)", href: "/current" },
      { label: "Vol. 3, No. 1 (2026)", href: "/archives/vol-3-no-1" },
    ],
  },
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "cfp-2026",
    date: "January 15, 2026",
    title: "Call for Papers: Special Issue on Service Economies",
    excerpt: "TUES Economics Journal invites submissions on digital platforms, gig work, and service-sector productivity.",
    body: [
      "The special issue will be guest-edited by members of the editorial board. Submissions close June 30, 2026.",
      "Authors should select the special issue track during submission. Standard peer review and APC policies apply.",
    ],
  },
  {
    id: "indexing-2025",
    date: "November 8, 2025",
    title: "Journal accepted for regional indexing database",
    excerpt: "TUES Economics Journal has been accepted into the Central Asian Economics Index (CAEI).",
    body: [
      "Indexed articles will appear within 8–12 weeks of publication. Authors do not need to take additional action.",
    ],
  },
  {
    id: "apc-update",
    date: "September 1, 2025",
    title: "APC waiver policy updated",
    excerpt: "Expanded fee waivers for authors from low-income institutions and unfunded research projects.",
    body: [
      "Authors may request a waiver at submission or after acceptance. Decisions are made by the publisher within 10 business days.",
    ],
  },
  {
    id: "reviewer-drive",
    date: "July 20, 2025",
    title: "Reviewer recruitment drive",
    excerpt: "We welcome applications from qualified economists to join our reviewer pool.",
    body: [
      "Interested scholars should email a CV and areas of expertise to editorial@tuesjournal.example.",
    ],
  },
];

export const EDITORIAL_TEAM: EditorialMember[] = [
  {
    name: "Prof. Chief Editor",
    role: "Editor-in-Chief",
    affiliation: "TUES University, Department of Economics",
    email: "eic@journal.com",
  },
  {
    name: "Dr. Handling Editor",
    role: "Handling Editor — Macroeconomics",
    affiliation: "Department of Economics, TUES University",
  },
  {
    name: "Dr. Second Editor",
    role: "Handling Editor — Development Economics",
    affiliation: "Faculty of Business, TUES University",
  },
  {
    name: "Dr. Third Editor",
    role: "Handling Editor — Public Policy",
    affiliation: "School of Public Policy, TUES University",
  },
  {
    name: "Dr. Peer Reviewer",
    role: "Associate Editor — Methods",
    affiliation: "Research Institute of Applied Economics",
  },
  {
    name: "System Admin",
    role: "Publisher / Production",
    affiliation: "TUES University Press",
  },
];

export function getPolicyPage(slug: string): StaticPageContent | undefined {
  return POLICY_PAGES[slug as PolicySlug];
}

export function getInformationPage(slug: string): StaticPageContent | undefined {
  return INFORMATION_PAGES[slug as InformationSlug];
}

export function isValidPolicySlug(slug: string): slug is PolicySlug {
  return (POLICY_SLUGS as readonly string[]).includes(slug);
}

export function isValidInformationSlug(slug: string): slug is InformationSlug {
  return (INFORMATION_SLUGS as readonly string[]).includes(slug);
}
