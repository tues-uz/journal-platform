import type {
  ActivityEntry,
  AppStore,
  JournalSettings,
  Notification,
  PaymentRequest,
  PaymentSettings,
  Submission,
  StoreUser,
  Volume,
} from "@/lib/store/types";

/** Bump when seed shape changes so persisted localStorage picks up new demo data. */
export const SEED_VERSION = 11;

/** Staff demo accounts only — authors self-register and create their own submissions. */
export const SEED_USERS: StoreUser[] = [
  {
    id: "user-admin",
    name: "System Admin",
    email: "admin@journal.com",
    password: "admin123",
    roles: ["publisher_admin"],
    status: "active",
    institution: "TUES Journal",
    lastLogin: "2026-07-18T08:00:00Z",
  },
  {
    id: "user-staff",
    name: "Maria Staff",
    email: "staff@journal.com",
    password: "staff123",
    roles: ["editorial_staff"],
    status: "active",
    institution: "TUES Journal Office",
    lastLogin: "2026-07-18T10:15:00Z",
  },
  {
    id: "user-eic",
    name: "Prof. Chief Editor",
    email: "eic@journal.com",
    password: "eic123",
    roles: ["editor_in_chief"],
    status: "active",
    institution: "TUES Journal",
    lastLogin: "2026-07-19T09:00:00Z",
  },
  {
    id: "user-he",
    name: "Dr. Handling Editor",
    email: "editor@journal.com",
    password: "editor123",
    roles: ["handling_editor"],
    status: "active",
    institution: "Department of Economics",
    lastLogin: "2026-07-19T08:30:00Z",
  },
  {
    id: "user-reviewer",
    name: "Dr. Peer Reviewer",
    email: "reviewer@journal.com",
    password: "reviewer123",
    roles: ["reviewer"],
    status: "active",
    institution: "Research Institute",
    lastLogin: "2026-07-18T16:00:00Z",
  },
  {
    id: "user-copy",
    name: "Alex Copyeditor",
    email: "copy@journal.com",
    password: "copy123",
    roles: ["copyeditor"],
    status: "active",
    institution: "TUES Journal",
    lastLogin: "2026-07-17T11:00:00Z",
  },
  {
    id: "user-layout",
    name: "Sam Layout",
    email: "layout@journal.com",
    password: "layout123",
    roles: ["layout_editor"],
    status: "active",
    institution: "TUES Journal",
    lastLogin: "2026-07-16T13:45:00Z",
  },
  {
    id: "user-inactive",
    name: "Former Editor",
    email: "inactive@journal.com",
    password: "inactive123",
    roles: ["handling_editor"],
    status: "inactive",
    institution: "TUES Journal",
  },
];

/** Demo author accounts — paired with SEED_SUBMISSIONS for workflow previews. */
export const SEED_DEMO_AUTHORS: StoreUser[] = [
  {
    id: "user-author",
    name: "Dr. Jane Author",
    email: "author@journal.com",
    password: "author123",
    roles: ["author"],
    status: "active",
    institution: "University of Example",
    lastLogin: "2026-07-18T14:00:00Z",
  },
  {
    id: "user-multi",
    name: "Prof. Multi Author",
    email: "author2@journal.com",
    password: "author123",
    roles: ["author"],
    status: "active",
    institution: "State Research University",
    lastLogin: "2026-07-17T09:30:00Z",
  },
];

export const SEED_SUBMISSIONS: Submission[] = [
  {
    id: "sub-001",
    submissionNumber: "SJMS-2026-001",
    title: "Corporate Governance and Firm Performance in ASEAN Markets",
    abstract:
      "This paper investigates the relationship between board independence, ownership structure, and financial performance across ASEAN-listed firms.",
    keywords: ["corporate governance", "firm performance", "ASEAN"],
    language: "English",
    articleType: "Research Article",
    status: "administrative_review",
    authorId: "user-author",
    authors: [
      {
        name: "Dr. Jane Author",
        email: "author@journal.com",
        institution: "University of Example",
        isCorresponding: true,
      },
    ],
    plagiarismStatus: "pending",
    files: [
      {
        id: "file-001-ms",
        name: "SJMS-2026-001-manuscript.pdf",
        type: "manuscript",
        size: 491_520,
        uploadedAt: "2026-07-20T07:00:00Z",
      },
    ],
    createdAt: "2026-07-20T07:00:00Z",
    updatedAt: "2026-07-20T07:00:00Z",
  },
  {
    id: "sub-003",
    submissionNumber: "SJMS-2026-003",
    title: "Digital Transformation in Small and Medium Enterprises",
    abstract:
      "This study examines how SMEs adopt digital technologies and the organizational factors that accelerate or hinder transformation.",
    keywords: ["digital transformation", "SMEs", "technology adoption"],
    language: "English",
    articleType: "Research Article",
    status: "assigned",
    authorId: "user-author",
    authors: [
      {
        name: "Dr. Jane Author",
        email: "author@journal.com",
        institution: "University of Example",
        isCorresponding: true,
      },
    ],
    plagiarismStatus: "passed",
    similarityScore: 8,
    files: [
      {
        id: "file-003-ms",
        name: "SJMS-2026-003-manuscript.pdf",
        type: "manuscript",
        size: 524_288,
        uploadedAt: "2026-07-10T08:00:00Z",
      },
    ],
    createdAt: "2026-07-10T08:00:00Z",
    updatedAt: "2026-07-19T11:00:00Z",
  },
  {
    id: "sub-004",
    submissionNumber: "SJMS-2026-004",
    title: "Leadership Styles and Employee Engagement in Hybrid Workplaces",
    abstract:
      "We investigate how transformational and transactional leadership styles affect engagement among hybrid teams.",
    keywords: ["leadership", "employee engagement", "hybrid work"],
    language: "English",
    articleType: "Research Article",
    status: "assigned",
    authorId: "user-multi",
    authors: [
      {
        name: "Prof. Multi Author",
        email: "author2@journal.com",
        institution: "State Research University",
        isCorresponding: true,
      },
    ],
    handlingEditorId: "user-he",
    plagiarismStatus: "passed",
    similarityScore: 11,
    files: [
      {
        id: "file-004-ms",
        name: "SJMS-2026-004-manuscript.pdf",
        type: "manuscript",
        size: 612_352,
        uploadedAt: "2026-07-12T10:30:00Z",
      },
    ],
    createdAt: "2026-07-12T10:30:00Z",
    updatedAt: "2026-07-19T09:45:00Z",
  },
  {
    id: "sub-005",
    submissionNumber: "SJMS-2026-005",
    title: "Sustainable Supply Chain Management in Emerging Markets",
    abstract:
      "A comparative analysis of sustainability practices across supply chains in Southeast Asian emerging economies.",
    keywords: ["supply chain", "sustainability", "emerging markets"],
    language: "English",
    articleType: "Research Article",
    status: "under_review",
    authorId: "user-author",
    authors: [
      {
        name: "Dr. Jane Author",
        email: "author@journal.com",
        institution: "University of Example",
        isCorresponding: true,
      },
    ],
    handlingEditorId: "user-he",
    reviewerId: "user-reviewer",
    reviewerInvitationStatus: "accepted",
    reviewSubmitted: true,
    reviewComments:
      "The manuscript makes a strong contribution. Minor clarifications on methodology are needed before acceptance.",
    editorRecommendation: "accept",
    editorRecommendationNotes:
      "Reviewer recommends acceptance with minor clarifications. Recommend acceptance.",
    editorRecommendationAt: "2026-07-19T08:00:00Z",
    plagiarismStatus: "passed",
    similarityScore: 6,
    files: [
      {
        id: "file-005-ms",
        name: "SJMS-2026-005-manuscript.pdf",
        type: "manuscript",
        size: 487_424,
        uploadedAt: "2026-06-28T14:00:00Z",
      },
    ],
    createdAt: "2026-06-28T14:00:00Z",
    updatedAt: "2026-07-19T08:15:00Z",
  },
  {
    id: "sub-006",
    submissionNumber: "SJMS-2026-006",
    title: "Workplace Innovation and Productivity in the Post-Pandemic Era",
    abstract:
      "This paper explores how organizations restructured innovation processes after the COVID-19 pandemic.",
    keywords: ["innovation", "productivity", "organizational change"],
    language: "English",
    articleType: "Research Article",
    status: "under_review",
    authorId: "user-multi",
    authors: [
      {
        name: "Prof. Multi Author",
        email: "author2@journal.com",
        institution: "State Research University",
        isCorresponding: true,
      },
    ],
    handlingEditorId: "user-he",
    reviewerId: "user-reviewer",
    reviewerInvitationStatus: "accepted",
    reviewSubmitted: true,
    reviewComments:
      "Interesting topic but the literature review needs expansion and the sample size is limited.",
    editorRecommendation: "minor_revision",
    editorRecommendationNotes:
      "Reviewer suggests minor revision to strengthen the literature review section.",
    editorRecommendationAt: "2026-07-18T16:30:00Z",
    plagiarismStatus: "passed",
    similarityScore: 9,
    files: [
      {
        id: "file-006-ms",
        name: "SJMS-2026-006-manuscript.pdf",
        type: "manuscript",
        size: 558_080,
        uploadedAt: "2026-07-01T11:00:00Z",
      },
    ],
    createdAt: "2026-07-01T11:00:00Z",
    updatedAt: "2026-07-18T16:45:00Z",
  },
  {
    id: "sub-007",
    submissionNumber: "SJMS-2026-007",
    title: "Consumer Behavior in Digital Marketplaces",
    abstract:
      "An empirical study of trust signals and purchase intention in Southeast Asian e-commerce platforms.",
    keywords: ["consumer behavior", "e-commerce", "digital marketplaces"],
    language: "English",
    articleType: "Research Article",
    status: "production",
    authorId: "user-author",
    authors: [
      {
        name: "Dr. Jane Author",
        email: "author@journal.com",
        institution: "University of Example",
        isCorresponding: true,
      },
    ],
    handlingEditorId: "user-he",
    layoutEditorId: "user-layout",
    layoutAssignedAt: "2026-07-10T09:00:00Z",
    layoutStartedAt: "2026-07-12T09:00:00Z",
    proofReady: true,
    proofApproved: true,
    plagiarismStatus: "passed",
    similarityScore: 7,
    files: [
      {
        id: "file-007-ms",
        name: "SJMS-2026-007-manuscript.pdf",
        type: "manuscript",
        size: 512_000,
        uploadedAt: "2026-06-15T10:00:00Z",
      },
    ],
    createdAt: "2026-06-15T10:00:00Z",
    updatedAt: "2026-07-20T12:00:00Z",
  },
  {
    id: "sub-008",
    submissionNumber: "SJMS-2026-008",
    title: "FinTech Adoption Among Micro-Enterprises",
    abstract:
      "This study analyzes barriers and facilitators to financial technology adoption among micro-enterprises in urban Indonesia.",
    keywords: ["fintech", "micro-enterprise", "technology adoption"],
    language: "English",
    articleType: "Research Article",
    status: "accepted",
    authorId: "user-multi",
    authors: [
      {
        name: "Prof. Multi Author",
        email: "author2@journal.com",
        institution: "State Research University",
        isCorresponding: true,
      },
    ],
    handlingEditorId: "user-he",
    plagiarismStatus: "passed",
    similarityScore: 10,
    files: [
      {
        id: "file-008-ms",
        name: "SJMS-2026-008-manuscript.pdf",
        type: "manuscript",
        size: 498_688,
        uploadedAt: "2026-06-20T09:00:00Z",
      },
    ],
    createdAt: "2026-06-20T09:00:00Z",
    updatedAt: "2026-07-19T15:00:00Z",
  },
  {
    id: "sub-009",
    submissionNumber: "SJMS-2025-009",
    title: "Digital Payment Adoption in Rural Markets",
    abstract:
      "A field study of mobile wallet uptake among small merchants in rural Central Asia, examining trust, literacy, and infrastructure as adoption drivers.",
    keywords: ["digital payments", "rural markets", "financial inclusion"],
    language: "English",
    articleType: "Research Article",
    status: "published",
    authorId: "user-author",
    authors: [
      {
        name: "Dr. Jane Author",
        email: "author@journal.com",
        institution: "University of Example",
        isCorresponding: true,
      },
    ],
    handlingEditorId: "user-he",
    proofApproved: true,
    plagiarismStatus: "passed",
    similarityScore: 6,
    volumeId: "vol-2025-1",
    issueId: "issue-2025-1-1",
    publishedAt: "2025-12-15T10:00:00Z",
    doi: "10.1234/sjms.2025.009",
    files: [
      {
        id: "file-009-ms",
        name: "SJMS-2025-009-manuscript.pdf",
        type: "manuscript",
        size: 445_440,
        uploadedAt: "2025-11-01T09:00:00Z",
      },
    ],
    createdAt: "2025-11-01T09:00:00Z",
    updatedAt: "2025-12-15T10:00:00Z",
  },
  {
    id: "sub-010",
    submissionNumber: "SJMS-2026-010",
    title: "Central Bank Digital Currencies: Opportunities for Central Asia",
    abstract:
      "This paper evaluates CBDC design choices and their implications for monetary policy transmission, cross-border settlement, and financial inclusion across Central Asian economies.",
    keywords: ["CBDC", "monetary policy", "Central Asia", "digital currency"],
    language: "English",
    articleType: "Research Article",
    status: "published",
    authorId: "user-multi",
    authors: [
      {
        name: "Prof. Multi Author",
        email: "author2@journal.com",
        institution: "State Research University",
        isCorresponding: true,
      },
    ],
    handlingEditorId: "user-he",
    proofApproved: true,
    plagiarismStatus: "passed",
    similarityScore: 5,
    volumeId: "vol-2026-1",
    issueId: "issue-2026-1-1",
    publishedAt: "2026-05-01T12:00:00Z",
    doi: "10.1234/sjms.2026.010",
    files: [
      {
        id: "file-010-ms",
        name: "SJMS-2026-010-manuscript.pdf",
        type: "manuscript",
        size: 612_352,
        uploadedAt: "2026-03-10T08:00:00Z",
      },
    ],
    createdAt: "2026-03-10T08:00:00Z",
    updatedAt: "2026-05-01T12:00:00Z",
  },
  {
    id: "sub-011",
    submissionNumber: "SJMS-2026-011",
    title: "Machine Learning Applications in Healthcare Diagnostics",
    abstract:
      "This review synthesizes recent advances in machine learning methods for clinical diagnosis, with emphasis on imaging, pathology, and risk stratification in resource-limited settings.",
    keywords: ["machine learning", "healthcare", "diagnostics", "medical imaging"],
    language: "English",
    articleType: "Review Article",
    status: "production",
    authorId: "user-author",
    authors: [
      {
        name: "Dr. Jane Author",
        email: "author@journal.com",
        institution: "University of Example",
        isCorresponding: true,
      },
    ],
    handlingEditorId: "user-he",
    layoutEditorId: "user-layout",
    layoutAssignedAt: "2026-07-19T09:00:00Z",
    layoutDueDate: "2026-07-26T09:00:00Z",
    copyeditorId: "user-copy",
    copyeditedAt: "2026-07-18T14:00:00Z",
    copyeditNotes:
      "Applied journal style guide. Figure 3 redrawn per author request. Verify table alignment in layout.",
    proofReady: false,
    proofApproved: false,
    plagiarismStatus: "passed",
    similarityScore: 8,
    volumeId: "vol-2026-1",
    issueId: "issue-2026-1-2",
    files: [
      {
        id: "file-011-ms",
        name: "SJMS-2026-011-manuscript.pdf",
        type: "manuscript",
        size: 524_288,
        uploadedAt: "2026-07-01T10:00:00Z",
      },
      {
        id: "file-011-copyedit",
        name: "SJMS-2026-011-copyedit.pdf",
        type: "copyedit",
        size: 531_000,
        uploadedAt: "2026-07-18T14:00:00Z",
      },
    ],
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-19T09:00:00Z",
  },
];

export const SEED_VOLUMES: Volume[] = [
  {
    id: "vol-2026-1",
    number: 1,
    year: 2026,
    title: "Volume 1 (2026)",
    status: "published",
    issues: [
      {
        id: "issue-2026-1-1",
        volumeId: "vol-2026-1",
        number: 1,
        title: "January 2026",
        status: "published",
        publishedAt: "2026-05-01T00:00:00Z",
        articleIds: ["sub-010"],
      },
      {
        id: "issue-2026-1-2",
        volumeId: "vol-2026-1",
        number: 2,
        title: "July 2026",
        status: "draft",
        articleIds: [],
      },
    ],
  },
  {
    id: "vol-2025-1",
    number: 1,
    year: 2025,
    title: "Volume 1 (2025)",
    status: "published",
    issues: [
      {
        id: "issue-2025-1-1",
        volumeId: "vol-2025-1",
        number: 1,
        title: "Inaugural Issue",
        status: "published",
        publishedAt: "2025-12-15T00:00:00Z",
        articleIds: ["sub-009"],
      },
    ],
  },
];

export const SEED_PAYMENT_SETTINGS: PaymentSettings = {
  enabled: true,
  amount: 500000,
  currency: "IDR",
  bankName: "Bank Mandiri",
  accountName: "TUES Journal Press",
  accountNumber: "1234567890",
  transferInstructions:
    "Include your full name in the transfer memo. Upload a screenshot or PDF of the transfer receipt after payment.",
  updatedAt: "2026-07-01T09:00:00Z",
  updatedBy: "user-admin",
};

export const SEED_PAYMENTS: PaymentRequest[] = [
  {
    id: "pay-author-001",
    authorId: "user-author",
    amount: 500000,
    currency: "IDR",
    status: "approved",
    proofFile: {
      id: "proof-author-001",
      name: "payment-receipt-author.pdf",
      size: 102_400,
      uploadedAt: "2026-07-15T10:00:00Z",
    },
    referenceNote: "Jane Author — July submission fee",
    submittedAt: "2026-07-15T10:00:00Z",
    reviewedAt: "2026-07-15T14:00:00Z",
    reviewedBy: "user-admin",
  },
  {
    id: "pay-author-002",
    authorId: "user-multi",
    amount: 500000,
    currency: "IDR",
    status: "approved",
    proofFile: {
      id: "proof-author-002",
      name: "payment-receipt-author2.pdf",
      size: 98_304,
      uploadedAt: "2026-07-14T09:00:00Z",
    },
    referenceNote: "Multi Author — July submission fee",
    submittedAt: "2026-07-14T09:00:00Z",
    reviewedAt: "2026-07-14T11:30:00Z",
    reviewedBy: "user-admin",
  },
];

export const SEED_JOURNAL_SETTINGS: JournalSettings = {
  journalName: "Journal of Management Studies",
  shortName: "SJMS",
  publisher: "Thailand University of Economics and Social Sciences Press",
  issn: "2795-4821",
  contactEmail: "editorial@journal.com",
  submissionGuidelines:
    "Manuscripts should be 6,000–9,000 words, formatted in APA 7th edition, and submitted with a blinded main document.",
  reviewPolicy: "double-blind",
  defaultLanguage: "English",
  updatedAt: "2026-07-01T09:00:00Z",
  updatedBy: "user-admin",
};

export const SEED_ACTIVITIES: ActivityEntry[] = [
  {
    id: "act-001",
    submissionId: "sub-001",
    action: "Manuscript Submitted",
    actorId: "user-author",
    actorName: "Dr. Jane Author",
    actorRoles: ["author"],
    statusAfter: "administrative_review",
    timestamp: "2026-07-20T07:00:00Z",
    details: "Awaiting administrative screening",
  },
  {
    id: "act-003",
    submissionId: "sub-003",
    action: "Status changed to assigned",
    actorId: "user-staff",
    actorName: "Maria Staff",
    actorRoles: ["editorial_staff"],
    statusAfter: "assigned",
    timestamp: "2026-07-19T11:00:00Z",
    details: "Passed administrative screening",
  },
  {
    id: "act-004",
    submissionId: "sub-004",
    action: "Handling Editor Assigned",
    actorId: "user-eic",
    actorName: "Prof. Chief Editor",
    actorRoles: ["editor_in_chief"],
    timestamp: "2026-07-19T09:45:00Z",
    details: "Handling editor assigned",
  },
  {
    id: "act-005-review",
    submissionId: "sub-005",
    action: "Review Submitted",
    actorId: "user-reviewer",
    actorName: "Dr. Peer Reviewer",
    actorRoles: ["reviewer"],
    timestamp: "2026-07-18T14:00:00Z",
    details: "Recommendation: accept",
  },
  {
    id: "act-005-rec",
    submissionId: "sub-005",
    action: "Editorial Recommendation Submitted",
    actorId: "user-he",
    actorName: "Dr. Handling Editor",
    actorRoles: ["handling_editor"],
    timestamp: "2026-07-19T08:00:00Z",
    details: "Recommendation: accept. Recommend acceptance.",
  },
  {
    id: "act-006-rec",
    submissionId: "sub-006",
    action: "Editorial Recommendation Submitted",
    actorId: "user-he",
    actorName: "Dr. Handling Editor",
    actorRoles: ["handling_editor"],
    timestamp: "2026-07-18T16:30:00Z",
    details: "Recommendation: minor revision. Reviewer suggests minor revision.",
  },
  {
    id: "act-007-proof",
    submissionId: "sub-007",
    action: "Author approved proof",
    actorId: "user-author",
    actorName: "Dr. Jane Author",
    actorRoles: ["author"],
    statusAfter: "production",
    timestamp: "2026-07-20T12:00:00Z",
    details: "Manuscript proof approved for publication",
  },
  {
    id: "act-009-pub",
    submissionId: "sub-009",
    action: "Published",
    actorId: "user-admin",
    actorName: "System Admin",
    actorRoles: ["publisher_admin"],
    statusAfter: "published",
    timestamp: "2025-12-15T10:00:00Z",
    details: "Released in Vol. 1, Issue 1 (2025)",
  },
  {
    id: "act-011-assign",
    submissionId: "sub-011",
    action: "Assigned to Layout Editor",
    actorId: "user-admin",
    actorName: "System Admin",
    actorRoles: ["publisher_admin"],
    statusAfter: "production",
    timestamp: "2026-07-19T09:00:00Z",
    details: "Assigned to Sam Layout",
  },
  {
    id: "act-010-pub",
    submissionId: "sub-010",
    action: "Published",
    actorId: "user-admin",
    actorName: "System Admin",
    actorRoles: ["publisher_admin"],
    statusAfter: "published",
    timestamp: "2026-05-01T12:00:00Z",
    details: "Released in Vol. 1, Issue 1 (2026)",
  },
];

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-021",
    userId: "user-layout",
    title: "Layout Assignment",
    message: "SJMS-2026-011 has been assigned to you for layout.",
    read: false,
    createdAt: "2026-07-19T09:00:00Z",
    link: "/dashboard/submissions/sub-011",
  },
  {
    id: "notif-017",
    userId: "user-staff",
    title: "New Submission for Screening",
    message: "SJMS-2026-001 requires administrative screening.",
    read: false,
    createdAt: "2026-07-20T07:00:00Z",
    link: "/dashboard/submissions/sub-001",
  },
  {
    id: "notif-016",
    userId: "user-admin",
    title: "User Management",
    message: "1 inactive user account requires review.",
    read: false,
    createdAt: "2026-07-19T08:00:00Z",
    link: "/dashboard/users",
  },
  {
    id: "notif-020",
    userId: "user-admin",
    title: "Proof Approved",
    message: "SJMS-2026-007 is ready to publish.",
    read: false,
    createdAt: "2026-07-20T12:00:00Z",
    link: "/dashboard/published",
  },
  {
    id: "notif-018",
    userId: "user-eic",
    title: "Editorial Decisions",
    message: "4 submissions awaiting your editorial decision.",
    read: false,
    createdAt: "2026-07-19T11:00:00Z",
    link: "/dashboard/editorial-decision",
  },
  {
    id: "notif-019",
    userId: "user-he",
    title: "Editor Assigned",
    message: "SJMS-2026-004 has been assigned to you as handling editor.",
    read: false,
    createdAt: "2026-07-19T09:45:00Z",
    link: "/dashboard/submissions/sub-004",
  },
];

/** Demo-only IDs removed on migrate — real author accounts and submissions are kept. */
export const SEED_DEMO_AUTHOR_IDS = new Set(["user-author", "user-multi"]);
export const SEED_DEMO_PAYMENT_IDS = new Set(["pay-author-001", "pay-author-002"]);
export const SEED_DEMO_SUBMISSION_IDS = new Set([
  "sub-001",
  "sub-002",
  "sub-003",
  "sub-004",
  "sub-005",
  "sub-006",
  "sub-007",
  "sub-008",
  "sub-009",
  "sub-010",
  "sub-011",
  "sub-012",
  "sub-013",
  "sub-014",
]);

export function stripSeedDemoData(state: AppStore): AppStore {
  const users = [
    ...state.users.filter((u) => !SEED_DEMO_AUTHOR_IDS.has(u.id)),
    ...SEED_USERS.filter(
      (seedUser) => !state.users.some((u) => u.email === seedUser.email),
    ),
    ...SEED_DEMO_AUTHORS.filter(
      (seedAuthor) => !state.users.some((u) => u.email === seedAuthor.email),
    ),
  ];
  const userIds = new Set(users.map((u) => u.id));

  const submissions = [
    ...state.submissions.filter((s) => !SEED_DEMO_SUBMISSION_IDS.has(s.id)),
    ...SEED_SUBMISSIONS,
  ];
  const submissionIds = new Set(submissions.map((s) => s.id));

  const activityIds = new Set(state.activities.map((a) => a.id));
  const activities = [
    ...state.activities.filter(
      (a) => a.submissionId === "payment" || submissionIds.has(a.submissionId),
    ),
    ...SEED_ACTIVITIES.filter((a) => !activityIds.has(a.id)),
  ];

  const notificationIds = new Set(state.notifications.map((n) => n.id));
  const notifications = [
    ...state.notifications.filter((n) => {
      if (!userIds.has(n.userId)) return false;
      if (!n.link?.includes("/dashboard/submissions/")) return true;
      return submissions.some((s) => n.link?.includes(s.id));
    }),
    ...SEED_NOTIFICATIONS.filter((n) => !notificationIds.has(n.id)),
  ];

  const payments = [
    ...state.payments.filter((p) => !SEED_DEMO_PAYMENT_IDS.has(p.id)),
    ...SEED_PAYMENTS,
  ];

  const volumes = state.volumes.map((vol) => ({
    ...vol,
    issues: vol.issues.map((issue) => ({
      ...issue,
      articleIds: issue.articleIds.filter((id) => submissionIds.has(id)),
    })),
  }));

  return {
    users,
    submissions,
    activities,
    notifications,
    volumes,
    journalSettings: state.journalSettings,
    payments,
    paymentSettings: state.paymentSettings ?? SEED_PAYMENT_SETTINGS,
  };
}

/** Assigns the first active layout editor to production submissions missing one. */
export function repairProductionAssignments(state: AppStore): AppStore {
  const layoutEditor = state.users.find(
    (u) => u.status === "active" && u.roles.includes("layout_editor"),
  );
  if (!layoutEditor) return state;

  const now = new Date().toISOString();
  let changed = false;
  const submissions = state.submissions.map((submission) => {
    if (submission.status === "production" && !submission.layoutEditorId) {
      changed = true;
      return {
        ...submission,
        layoutEditorId: layoutEditor.id,
        layoutAssignedAt: submission.layoutAssignedAt ?? now,
      };
    }
    return submission;
  });

  if (!changed) return state;
  return { ...state, submissions };
}

export const SEED_DATA: AppStore = {
  users: [...SEED_USERS, ...SEED_DEMO_AUTHORS],
  submissions: SEED_SUBMISSIONS,
  activities: SEED_ACTIVITIES,
  notifications: SEED_NOTIFICATIONS,
  volumes: SEED_VOLUMES,
  journalSettings: SEED_JOURNAL_SETTINGS,
  payments: SEED_PAYMENTS,
  paymentSettings: SEED_PAYMENT_SETTINGS,
};

/**
 * Role → sidebar menu coverage (PRD-aligned):
 *
 * editorial_staff: Screening, Plagiarism, Notifications
 * editor_in_chief: All Submissions, Editorial Decision, Notifications
 * handling_editor: Assigned Submissions, Reviewer Assignment, Review Monitoring
 * reviewer: Assigned Reviews, Notifications
 * copyeditor: Copyediting Queue, Notifications
 * layout_editor: Layout Queue, Production Files
 * publisher_admin: Publication, Issues, DOI, Users, Settings, Payments
 */
