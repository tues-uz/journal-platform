import type { SubmissionDto } from "@/lib/api/submissions";
import type { ManagedPayment, ManagedPaymentSettings } from "@/lib/api/payments";
import type { ManagedUser, UserCandidate } from "@/lib/api/users";
import type { ManagedVolume } from "@/lib/api/volumes";
import type { ManagedIssue } from "@/lib/api/issues";
import type {
  Notification,
  PaymentRequest,
  PaymentSettings,
  StoreUser,
  Submission,
  SubmissionFile,
  Volume,
  Issue,
  ActivityEntry,
} from "@/lib/store/types";
import type { PublicArticle } from "@/lib/store/publicArticles";
import { getPublicPublishedArticles, getVolumeIssueLabel } from "@/lib/store/publicArticles";
import { useJournalStore } from "@/lib/store/store";
import {
  fromNumericIssueId,
  fromNumericUserId,
  fromNumericVolumeId,
  toNumericIssueId,
  toNumericNotificationId,
  toNumericPaymentId,
  toNumericSubmissionId,
  toNumericUserId,
  toNumericVolumeId,
  toNumericActivityId,
} from "@/lib/demo/ids";

import { getHandlingEditorIds } from "@/lib/workflow/handlingEditors";
import { getReviewerSlots } from "@/lib/workflow/reviewers";

function upper(value: string | undefined): string | null {
  return value ? value.toUpperCase() : null;
}

function mapSubmissionFile(file: SubmissionFile, uploadedById?: string) {
  return {
    id: Number.parseInt(file.id.replace(/\D/g, ""), 10) || toNumericSubmissionId(file.id),
    name: file.name,
    type: file.type.toUpperCase(),
    size: file.size,
    feedbackKind: file.feedbackKind ? file.feedbackKind.toUpperCase() : null,
    format: file.format ? file.format.toUpperCase() : null,
    version: file.version ?? null,
    uploadedById: uploadedById ? toNumericUserId(uploadedById) : 0,
    uploadedAt: file.uploadedAt,
  };
}

export function submissionToDto(submission: Submission): SubmissionDto {
  const state = useJournalStore.getState();
  const author = state.getUserById(submission.authorId);
  const handlingEditorIds = getHandlingEditorIds(submission);
  const handlingEditor = submission.handlingEditorId
    ? state.getUserById(submission.handlingEditorId)
    : undefined;
  const reviewer = submission.reviewerId ? state.getUserById(submission.reviewerId) : undefined;
  const copyeditor = submission.copyeditorId ? state.getUserById(submission.copyeditorId) : undefined;
  const layoutEditor = submission.layoutEditorId
    ? state.getUserById(submission.layoutEditorId)
    : undefined;
  const corresponding =
    submission.authors.find((a) => a.isCorresponding) ?? submission.authors[0];

  return {
    id: toNumericSubmissionId(submission.id),
    submissionNumber: submission.submissionNumber,
    title: submission.title,
    abstractText: submission.abstract,
    keywords: submission.keywords,
    language: submission.language,
    articleType: submission.articleType,
    status: submission.status.toUpperCase(),
    authorId: toNumericUserId(submission.authorId),
    authorName: corresponding?.name ?? author?.name ?? "Author",
    authors: submission.authors,
    handlingEditorId: submission.handlingEditorId
      ? toNumericUserId(submission.handlingEditorId)
      : null,
    handlingEditorName: handlingEditor?.name ?? null,
    handlingEditorIds:
      handlingEditorIds.length > 0
        ? handlingEditorIds.map((id) => toNumericUserId(id))
        : null,
    reviewerId: submission.reviewerId ? toNumericUserId(submission.reviewerId) : null,
    reviewerName: reviewer?.name ?? null,
    pendingReviewerId: submission.pendingReviewerId
      ? toNumericUserId(submission.pendingReviewerId)
      : null,
    reviewerInvitationStatus: upper(submission.reviewerInvitationStatus),
    reviewers: getReviewerSlots(submission).map((slot) => ({
      reviewerId: toNumericUserId(slot.reviewerId),
      invitationStatus: slot.invitationStatus.toUpperCase(),
      reviewSubmitted: slot.reviewSubmitted ?? false,
      recommendation: upper(slot.recommendation),
      comments: slot.comments ?? null,
    })),
    hePrescreenComplete: submission.hePrescreenComplete ?? false,
    proofReady: submission.proofReady ?? false,
    proofApproved: submission.proofApproved ?? false,
    acceptancePaymentVerified: submission.acceptancePaymentVerified ?? false,
    reviewSubmitted: submission.reviewSubmitted ?? false,
    decisionReason: submission.decisionReason ?? null,
    reviewComments: submission.reviewComments ?? null,
    editorRecommendation: upper(submission.editorRecommendation),
    editorRecommendationNotes: submission.editorRecommendationNotes ?? null,
    editorRecommendationAt: submission.editorRecommendationAt ?? null,
    revisionRound: submission.revisionRound ?? null,
    copyeditorId: submission.copyeditorId ? toNumericUserId(submission.copyeditorId) : null,
    copyeditorName: copyeditor?.name ?? null,
    copyeditedAt: submission.copyeditedAt ?? null,
    copyeditNotes: submission.copyeditNotes ?? null,
    layoutEditorId: submission.layoutEditorId ? toNumericUserId(submission.layoutEditorId) : null,
    layoutEditorName: layoutEditor?.name ?? null,
    layoutAssignedAt: submission.layoutAssignedAt ?? null,
    layoutStartedAt: submission.layoutStartedAt ?? null,
    layoutDueDate: submission.layoutDueDate ?? null,
    productionNotes: submission.productionNotes ?? null,
    layoutChecklist: submission.layoutChecklist ?? null,
    plagiarismStatus: upper(submission.plagiarismStatus),
    similarityScore: submission.similarityScore ?? null,
    plagiarismNotes: submission.plagiarismNotes ?? null,
    plagiarismCheckedAt: submission.plagiarismCheckedAt ?? null,
    volumeId: submission.volumeId ? toNumericVolumeId(submission.volumeId) : null,
    issueId: submission.issueId ? toNumericIssueId(submission.issueId) : null,
    publishedAt: submission.publishedAt ?? null,
    doi: submission.doi ?? null,
    files: submission.files.map((file) => mapSubmissionFile(file, submission.authorId)),
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

export function userToDto(user: StoreUser) {
  return {
    id: toNumericUserId(user.id),
    name: user.name,
    email: user.email,
    roles: user.roles.map((role) => role.toUpperCase()),
    status: user.status.toUpperCase(),
    institution: user.institution ?? null,
    avatarUrl: user.avatarUrl ?? null,
    lastLogin: user.lastLogin ?? null,
  };
}

export function userToCandidate(user: StoreUser): UserCandidate {
  return { id: user.id, name: user.name, avatarUrl: user.avatarUrl };
}

export function paymentToDto(payment: PaymentRequest): ManagedPayment {
  const state = useJournalStore.getState();
  const author = state.getUserById(payment.authorId);
  const reviewer = payment.reviewedBy ? state.getUserById(payment.reviewedBy) : undefined;

  return {
    id: String(toNumericPaymentId(payment.id)),
    authorId: payment.authorId,
    authorName: author?.name ?? "Author",
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    referenceNote: payment.referenceNote,
    submittedAt: payment.submittedAt,
    reviewedAt: payment.reviewedAt,
    reviewedById: payment.reviewedBy,
    reviewedByName: reviewer?.name,
    rejectionReason: payment.rejectionReason,
  };
}

export function paymentSettingsToDto(settings: PaymentSettings): ManagedPaymentSettings {
  return {
    enabled: settings.enabled,
    amount: settings.amount,
    currency: settings.currency,
    bankName: settings.bankName,
    accountName: settings.accountName,
    accountNumber: settings.accountNumber,
    transferInstructions: settings.transferInstructions,
    updatedAt: settings.updatedAt,
  };
}

export function volumeToDto(volume: Volume): ManagedVolume {
  const now = new Date().toISOString();
  return {
    id: String(toNumericVolumeId(volume.id)),
    number: volume.number,
    year: volume.year,
    title: volume.title,
    status: volume.status,
    createdAt: now,
    updatedAt: now,
  };
}

export function issueToDto(issue: Issue, volumeId: string): ManagedIssue {
  const now = new Date().toISOString();
  return {
    id: String(toNumericIssueId(issue.id)),
    volumeId: String(toNumericVolumeId(volumeId)),
    number: issue.number,
    title: issue.title,
    status: issue.status,
    publishedAt: issue.publishedAt,
    createdAt: now,
    updatedAt: now,
  };
}

export function notificationToDto(notification: Notification) {
  return {
    id: toNumericNotificationId(notification.id),
    title: notification.title,
    message: notification.message,
    read: notification.read,
    link: notification.link ?? null,
    createdAt: notification.createdAt,
  };
}

export function activityToDto(entry: ActivityEntry) {
  return {
    id: toNumericActivityId(entry.id),
    submissionId: toNumericSubmissionId(entry.submissionId),
    action: entry.action,
    actorName: entry.actorName,
    actorRoles: entry.actorRoles?.map((role) => role.toUpperCase()) ?? [],
    statusAfter: entry.statusAfter?.toUpperCase() ?? null,
    timestamp: entry.timestamp,
    details: entry.details ?? null,
  };
}

export function publicArticleToDto(article: PublicArticle) {
  const state = useJournalStore.getState();
  const submission = state.submissions.find((s) => s.id === article.id);
  const volume = submission?.volumeId
    ? state.volumes.find((v) => v.id === submission.volumeId)
    : undefined;
  const issue = volume?.issues.find((i) => i.id === submission?.issueId);

  return {
    id: toNumericSubmissionId(article.id),
    submissionNumber: article.submissionNumber,
    title: article.title,
    abstractText: article.excerpt,
    keywords: article.keywords,
    language: submission?.language ?? "English",
    articleType: article.category,
    authors: (submission?.authors ?? [{ name: article.author, email: "", isCorresponding: true }]).map(
      (author) => ({
        name: author.name,
        institution: author.institution ?? null,
        corresponding: author.isCorresponding ?? false,
      }),
    ),
    doi: article.doi ?? null,
    publishedAt: article.publishedAt,
    volumeId: submission?.volumeId ? toNumericVolumeId(submission.volumeId) : null,
    volumeNumber: volume?.number ?? null,
    volumeYear: volume?.year ?? null,
    issueId: submission?.issueId ? toNumericIssueId(submission.issueId) : null,
    issueNumber: issue?.number ?? null,
    fileUrl: article.manuscriptFile?.url ?? null,
    fileName: article.manuscriptFile?.fileName ?? null,
    fileFormat: article.manuscriptFile?.kind ? article.manuscriptFile.kind.toUpperCase() : null,
  };
}

export function listPublicArticleDtos() {
  const state = useJournalStore.getState();
  return getPublicPublishedArticles(
    state.submissions,
    state.getUserById,
    state.volumes,
    state.journalSettings,
  ).map(publicArticleToDto);
}

export function getVolumeIssueLabelFromStore(volumeId?: string, issueId?: string) {
  const state = useJournalStore.getState();
  return getVolumeIssueLabel(state.volumes, volumeId, issueId);
}

export function managedUserFromStore(user: StoreUser): ManagedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    status: user.status,
    institution: user.institution,
    avatarUrl: user.avatarUrl,
    lastLogin: user.lastLogin,
  };
}

export function resolveEditorIdsFromBody(body: Record<string, unknown>): string[] {
  if (Array.isArray(body.editorIds)) {
    return body.editorIds
      .map((value) => {
        if (typeof value === "number") return fromNumericUserId(value);
        const resolved = fromNumericUserId(value);
        return resolved ?? (typeof value === "string" ? value : undefined);
      })
      .filter((value): value is string => !!value);
  }
  if (typeof body.editorId === "string") {
    return [fromNumericUserId(body.editorId) ?? body.editorId];
  }
  const numeric = fromNumericUserId(body.editorId as number);
  return numeric ? [numeric] : [];
}

export function resolveEditorIdFromBody(body: Record<string, unknown>): string | undefined {
  return resolveEditorIdsFromBody(body)[0];
}

export function resolveReviewerIdFromBody(body: Record<string, unknown>): string | undefined {
  if (typeof body.reviewerId === "string") return body.reviewerId;
  return fromNumericUserId(body.reviewerId as number);
}

export function resolveVolumeIssueFromBody(body: Record<string, unknown>) {
  const volumeId =
    typeof body.volumeId === "string"
      ? body.volumeId
      : fromNumericVolumeId(body.volumeId as number);
  const issueId =
    typeof body.issueId === "string" ? body.issueId : fromNumericIssueId(body.issueId as number);
  return { volumeId, issueId };
}
