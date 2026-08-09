import type { Role } from "@/lib/rbac/types";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "administrative_review"
  | "assigned"
  | "under_review"
  | "revision_required"
  | "eic_approval_pending"
  | "payment_pending"
  | "accepted"
  | "rejected"
  | "copyediting"
  | "production"
  | "scheduled"
  | "published";

export interface ReviewerAssignment {
  reviewerId: string;
  invitationStatus: ReviewerInvitationStatus;
  reviewSubmitted?: boolean;
  recommendation?: string;
  comments?: string;
}

/** Minimum reviewers required before HE can recommend (PRD business rule). */
export const MIN_REVIEWERS = 2;

export interface StoreUser {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: Role[];
  status: "active" | "inactive";
  institution?: string;
  avatarUrl?: string;
  lastLogin?: string;
}

export interface SubmissionAuthor {
  name: string;
  email: string;
  institution: string;
  orcid?: string;
  isCorresponding: boolean;
}

export type PublicationFileFormat =
  | "pdf"
  | "html"
  | "xml"
  | "epub"
  | "supplementary"
  | "other";

export interface SubmissionFile {
  id: string;
  name: string;
  type:
    | "manuscript"
    | "cover_letter"
    | "supporting"
    | "revision"
    | "copyedit"
    | "response_letter"
    | "decision_feedback"
    | "publication";
  size: number;
  uploadedAt: string;
  dataUrl?: string;
  feedbackKind?: "review" | "decision";
  format?: PublicationFileFormat;
  version?: number;
  uploadedById?: string;
}

export interface ActivityEntry {
  id: string;
  submissionId: string;
  paymentId?: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRoles?: Role[];
  statusAfter?: SubmissionStatus;
  timestamp: string;
  details?: string;
}

export type PaymentStatus = "pending_review" | "approved" | "rejected";

export interface PaymentProofFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  dataUrl?: string;
}

export interface PaymentRequest {
  id: string;
  authorId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  proofFile: PaymentProofFile;
  referenceNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface PaymentSettings {
  enabled: boolean;
  amount: number;
  currency: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  transferInstructions?: string;
  updatedAt: string;
  updatedBy: string;
}

export type PlagiarismStatus = "pending" | "passed" | "failed";
export type ReviewerInvitationStatus = "pending" | "accepted" | "declined";

export interface Submission {
  id: string;
  submissionNumber: string;
  title: string;
  abstract: string;
  keywords: string[];
  language: string;
  articleType: string;
  status: SubmissionStatus;
  authorId: string;
  authorName?: string;
  authors: SubmissionAuthor[];
  handlingEditorId?: string;
  handlingEditorName?: string;
  /** Multiple handling editors may be assigned by the EiC. */
  handlingEditorIds?: string[];
  reviewerId?: string;
  reviewerName?: string;
  pendingReviewerId?: string;
  reviewerInvitationStatus?: ReviewerInvitationStatus;
  /** PRD: track multiple reviewer slots (min 2). */
  reviewers?: ReviewerAssignment[];
  /** HE completed pre-screening and cleared manuscript for peer review. */
  hePrescreenComplete?: boolean;
  revisionRound?: number;
  scheduledAt?: string;
  acceptancePaymentVerified?: boolean;
  proofReady?: boolean;
  proofApproved?: boolean;
  reviewSubmitted?: boolean;
  decisionReason?: string;
  reviewComments?: string;
  editorRecommendation?: string;
  editorRecommendationNotes?: string;
  editorRecommendationAt?: string;
  copyeditorId?: string;
  copyeditorName?: string;
  copyeditedAt?: string;
  copyeditNotes?: string;
  layoutEditorId?: string;
  layoutEditorName?: string;
  layoutAssignedAt?: string;
  layoutStartedAt?: string;
  layoutDueDate?: string;
  productionNotes?: string;
  layoutChecklist?: Record<string, boolean>;
  plagiarismStatus?: PlagiarismStatus;
  similarityScore?: number;
  plagiarismNotes?: string;
  plagiarismCheckedAt?: string;
  plagiarismCheckedBy?: string;
  volumeId?: string;
  issueId?: string;
  publishedAt?: string;
  doi?: string;
  files: SubmissionFile[];
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  volumeId: string;
  number: number;
  title?: string;
  status: "draft" | "published";
  publishedAt?: string;
  articleIds: string[];
}

export interface Volume {
  id: string;
  number: number;
  year: number;
  title?: string;
  status: "draft" | "published";
  issues: Issue[];
}

export interface JournalSettings {
  journalName: string;
  shortName: string;
  publisher: string;
  issn: string;
  contactEmail: string;
  submissionGuidelines: string;
  reviewPolicy: "single-blind" | "double-blind" | "open";
  defaultLanguage: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Notification {
  id: string;
  // Optional: the real API scopes /api/notifications to the caller already,
  // so this is only populated by the mock store.
  userId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AppStore {
  users: StoreUser[];
  submissions: Submission[];
  activities: ActivityEntry[];
  notifications: Notification[];
  volumes: Volume[];
  journalSettings: JournalSettings;
  payments: PaymentRequest[];
  paymentSettings: PaymentSettings;
}
