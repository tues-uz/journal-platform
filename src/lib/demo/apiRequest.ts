import { ApiClientError } from "@/lib/api/client";
import type { AuthUser } from "@/features/auth/storage";
import { useJournalStore } from "@/lib/store/store";
import { getDemoUserIdFromToken } from "@/lib/demo/session";
import {
  fromNumericNotificationId,
  fromNumericPaymentId,
  fromNumericUserId,
  registerNewPaymentId,
  registerNewSubmissionId,
  resolveSubmissionId,
  toNumericSubmissionId,
  toNumericVolumeId,
} from "@/lib/demo/ids";
import {
  activityToDto,
  issueToDto,
  listPublicArticleDtos,
  notificationToDto,
  paymentSettingsToDto,
  paymentToDto,
  publicArticleToDto,
  resolveEditorIdFromBody,
  resolveEditorIdsFromBody,
  resolveReviewerIdFromBody,
  resolveVolumeIssueFromBody,
  submissionToDto,
  userToCandidate,
  userToDto,
  volumeToDto,
} from "@/lib/demo/mappers";
import type { Submission, SubmissionAuthor, SubmissionStatus } from "@/lib/store/types";
import type { Role } from "@/lib/rbac/types";
import { getPublicPublishedArticles } from "@/lib/store/publicArticles";
import { allRequiredReviewsComplete, getReviewerSlots } from "@/lib/workflow/reviewers";
import { MIN_REVIEWERS } from "@/lib/store/types";

interface DemoRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  params?: Record<string, string | number | undefined>;
}

function requireActor(): { id: string; name: string; roles: Role[] } {
  const userId = getDemoUserIdFromToken();
  if (!userId) {
    throw new ApiClientError(401, "Not authenticated");
  }
  const user = useJournalStore.getState().getUserById(userId);
  if (!user) {
    throw new ApiClientError(401, "Not authenticated");
  }
  return { id: user.id, name: user.name, roles: user.roles };
}

function getSubmissionOrThrow(id: string): Submission {
  const submissionId = resolveSubmissionId(id);
  const submission = useJournalStore.getState().submissions.find((s) => s.id === submissionId);
  if (!submission) {
    throw new ApiClientError(404, "Submission not found");
  }
  return submission;
}

function returnSubmission(id: string) {
  return submissionToDto(getSubmissionOrThrow(id));
}

function mapRecommendation(value: string): string {
  return value.toLowerCase();
}

function mapDecision(decision: string): SubmissionStatus {
  switch (decision) {
    case "ACCEPT":
      return "accepted";
    case "MINOR_REVISION":
    case "FURTHER_REVISION":
    case "MAJOR_REVISION":
      return "revision_required";
    case "REJECT":
    case "REJECT_AFTER_REVISION":
    case "DESK_REJECT":
      return "rejected";
    default:
      return "under_review";
  }
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function handleWorkflowPost(path: string, body: Record<string, unknown>) {
  const store = useJournalStore.getState();
  const actor = requireActor();
  const match = path.match(/^\/api\/submissions\/([^/]+)\/(.+)$/);
  if (!match) throw new ApiClientError(404, "Not found");

  const submissionId = resolveSubmissionId(match[1]!);
  const action = match[2]!;

  switch (action) {
    case "plagiarism":
      store.recordPlagiarismCheck(submissionId, actor.id, actor.name, {
        status: String(body.status).toLowerCase() as "passed" | "failed",
        similarityScore:
          body.similarityScore != null ? Number(body.similarityScore) : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      break;
    case "screening": {
      const decision = String(body.decision);
      if (decision === "APPROVE") {
        store.updateSubmissionStatus(
          submissionId,
          "assigned",
          actor.id,
          actor.name,
          "Administrative screening approved",
        );
      } else if (decision === "DESK_REJECT") {
        store.updateSubmissionStatus(
          submissionId,
          "rejected",
          actor.id,
          actor.name,
          "Desk rejected during screening",
          typeof body.reason === "string" ? body.reason : undefined,
        );
      } else {
        store.updateSubmissionStatus(
          submissionId,
          "revision_required",
          actor.id,
          actor.name,
          "Revision requested during screening",
          typeof body.reason === "string" ? body.reason : undefined,
        );
      }
      break;
    }
    case "assign-editor": {
      const editorIds = resolveEditorIdsFromBody(body);
      if (editorIds.length === 0) throw new ApiClientError(400, "Editor is required");
      const submission = getSubmissionOrThrow(submissionId);
      for (const editorId of editorIds) {
        store.assignHandlingEditor(submissionId, editorId, actor.id, actor.name);
      }
      if (submission.status === "submitted") {
        store.updateSubmission(submissionId, { status: "assigned" });
      }
      break;
    }
    case "invite-reviewer": {
      const reviewerId = resolveReviewerIdFromBody(body);
      if (!reviewerId) throw new ApiClientError(400, "Reviewer is required");
      store.assignReviewer(submissionId, reviewerId, actor.id, actor.name);
      break;
    }
    case "reviewer-invitation":
      store.respondToReviewerInvitation(submissionId, actor.id, body.accept === true);
      break;
    case "review":
      store.submitReview(
        submissionId,
        mapRecommendation(String(body.recommendation)),
        actor.id,
        actor.name,
        typeof body.comments === "string" ? body.comments : undefined,
      );
      break;
    case "recommendation": {
      const current = getSubmissionOrThrow(submissionId);
      if (!allRequiredReviewsComplete(current)) {
        throw new ApiClientError(
          400,
          `At least ${MIN_REVIEWERS} completed reviews are required before submitting a recommendation.`,
        );
      }
      store.submitEditorRecommendation(
        submissionId,
        mapRecommendation(String(body.recommendation)),
        actor.id,
        actor.name,
        typeof body.notes === "string" ? body.notes : undefined,
      );
      break;
    }
    case "he-prescreen": {
      const decision = String(body.decision);
      const reason = typeof body.reason === "string" ? body.reason : undefined;
      if (decision === "SEND_TO_REVIEW") {
        store.hePrescreen(submissionId, "send_to_review", actor.id, actor.name, reason);
      } else if (decision === "DESK_REJECT") {
        store.hePrescreen(submissionId, "desk_reject", actor.id, actor.name, reason);
      } else {
        store.hePrescreen(submissionId, "return", actor.id, actor.name, reason);
      }
      break;
    }
    case "submit-revision":
      store.submitAuthorRevision(submissionId, actor.id, actor.name);
      break;
    case "eic-revision/approve":
      store.approveEicRevision(
        submissionId,
        actor.id,
        actor.name,
        typeof body.notes === "string" ? body.notes : undefined,
      );
      break;
    case "eic-revision/request-further":
      store.requestFurtherEicRevision(
        submissionId,
        actor.id,
        actor.name,
        typeof body.reason === "string" ? body.reason : undefined,
      );
      break;
    case "schedule": {
      const scheduledAt = String(body.scheduledAt ?? "");
      if (!scheduledAt.trim()) {
        throw new ApiClientError(400, "Publication date is required.");
      }
      store.schedulePublication(submissionId, scheduledAt, actor.id, actor.name);
      break;
    }
    case "decision":
      store.updateSubmissionStatus(
        submissionId,
        mapDecision(String(body.decision)),
        actor.id,
        actor.name,
        "Editorial decision recorded",
        typeof body.reason === "string" ? body.reason : undefined,
      );
      break;
    case "layout/start": {
      const started = store.startLayout(submissionId, actor.id, actor.name);
      if (!started) {
        throw new ApiClientError(
          400,
          "Publication payment must be verified before layout can begin.",
        );
      }
      break;
    }
    case "layout/send-for-proof": {
      const sent = store.sendForProof(submissionId, actor.id, actor.name);
      if (!sent) {
        throw new ApiClientError(
          400,
          "Upload at least one publication file before sending for author proof.",
        );
      }
      break;
    }
    case "proof":
      if (body.approve === true) {
        store.updateSubmission(submissionId, { proofApproved: true });
        store.addActivity({
          submissionId,
          action: "Proof Approved",
          actorId: actor.id,
          actorName: actor.name,
          actorRoles: actor.roles,
          timestamp: new Date().toISOString(),
        });
      } else {
        store.updateSubmission(submissionId, { proofApproved: false, proofReady: false });
        store.addActivity({
          submissionId,
          action: "Proof Rejected",
          actorId: actor.id,
          actorName: actor.name,
          actorRoles: actor.roles,
          details: typeof body.note === "string" ? body.note : undefined,
          timestamp: new Date().toISOString(),
        });
      }
      break;
    case "publish": {
      const { volumeId, issueId } = resolveVolumeIssueFromBody(body);
      if (typeof body.doi === "string" && body.doi.trim()) {
        store.assignDoi(submissionId, body.doi.trim(), actor.id, actor.name);
      }
      store.updateSubmission(submissionId, { volumeId, issueId });
      store.updateSubmissionStatus(submissionId, "published", actor.id, actor.name, "Published");
      break;
    }
    default:
      throw new ApiClientError(404, "Not found");
  }

  return returnSubmission(submissionId);
}

export async function demoApiRequest<T>(
  path: string,
  options: DemoRequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const body = (options.body ?? {}) as Record<string, unknown>;
  const store = useJournalStore.getState();

  if (path === "/api/auth/login" && method === "POST") {
    const user = store.authenticate(String(body.email ?? ""), String(body.password ?? ""));
    if (!user) throw new ApiClientError(401, "Invalid email or password");
    return {
      accessToken: `demo-access-${user.id}`,
      refreshToken: `demo-refresh-${user.id}`,
      user: userToDto(user),
    } as T;
  }

  if (path === "/api/auth/register" && method === "POST") {
    const result = store.registerAuthor({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      institution: typeof body.institution === "string" ? body.institution : undefined,
    });
    if (!result.success || !result.user) {
      throw new ApiClientError(400, result.error ?? "Registration failed");
    }
    return {
      accessToken: `demo-access-${result.user.id}`,
      refreshToken: `demo-refresh-${result.user.id}`,
      user: userToDto(result.user),
    } as T;
  }

  if (path === "/api/auth/refresh" && method === "POST") {
    const userId = String(body.refreshToken ?? "").replace("demo-refresh-", "");
    const user = store.getUserById(userId);
    if (!user) throw new ApiClientError(401, "Invalid refresh token");
    return {
      accessToken: `demo-access-${user.id}`,
      refreshToken: `demo-refresh-${user.id}`,
    } as T;
  }

  if (path === "/api/me") {
    const user = store.getUserById(requireActor().id);
    if (!user) throw new ApiClientError(401, "Not authenticated");
    return userToDto(user) as T;
  }

  if (path === "/api/submissions" && method === "GET") {
    requireActor();
    return store.submissions.map(submissionToDto) as T;
  }

  if (path === "/api/submissions" && method === "POST") {
    const actor = requireActor();
    const now = new Date().toISOString();
    const submissionId = generateId("sub");
    registerNewSubmissionId(submissionId);
    const submission: Submission = {
      id: submissionId,
      submissionNumber: `SJMS-${new Date().getFullYear()}-${String(store.submissions.length + 1).padStart(3, "0")}`,
      title: String(body.title ?? ""),
      abstract: String(body.abstractText ?? ""),
      keywords: (body.keywords as string[]) ?? [],
      language: String(body.language ?? "English"),
      articleType: String(body.articleType ?? "Original Manuscript"),
      status: body.saveAsDraft ? "draft" : "submitted",
      authorId: actor.id,
      authors: (body.authors as SubmissionAuthor[]) ?? [],
      files: [],
      createdAt: now,
      updatedAt: now,
    };
    store.addSubmission(submission);
    store.addActivity({
      submissionId,
      action: body.saveAsDraft ? "Draft Saved" : "Manuscript Submitted",
      actorId: actor.id,
      actorName: actor.name,
      actorRoles: actor.roles,
      statusAfter: submission.status,
      timestamp: now,
    });
    return submissionToDto(submission) as T;
  }

  if (path.match(/^\/api\/submissions\/[^/]+\/activities$/) && method === "GET") {
    requireActor();
    const submissionId = resolveSubmissionId(path.split("/")[3]!);
    getSubmissionOrThrow(submissionId);
    return store.activities
      .filter((entry) => entry.submissionId === submissionId)
      .map(activityToDto)
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ) as T;
  }

  if (path.match(/^\/api\/submissions\/[^/]+$/) && method === "GET") {
    requireActor();
    return returnSubmission(path.split("/").pop()!) as T;
  }

  if (path.match(/^\/api\/submissions\/[^/]+\/doi$/) && method === "PATCH") {
    const actor = requireActor();
    const submissionId = resolveSubmissionId(path.split("/")[3]!);
    store.assignDoi(submissionId, String(body.doi ?? ""), actor.id, actor.name);
    return returnSubmission(submissionId) as T;
  }

  if (path.match(/^\/api\/submissions\/[^/]+\/files\/presign$/) && method === "POST") {
    requireActor();
    return {
      uploadUrl: "demo://upload",
      key: `demo/${Date.now()}/${String(body.filename ?? "file")}`,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    } as T;
  }

  if (path.match(/^\/api\/submissions\/[^/]+\/files\/complete$/) && method === "POST") {
    const actor = requireActor();
    const submissionId = resolveSubmissionId(path.split("/")[3]!);
    const submission = getSubmissionOrThrow(submissionId);
    const fileId = generateId("file");
    const rawType = String(body.type ?? "MANUSCRIPT").toUpperCase();
    const normalizedType = rawType.replace(/-/g, "_").toLowerCase() as Submission["files"][number]["type"];
    const file = {
      id: fileId,
      name: String(body.filename ?? "upload.bin"),
      type: normalizedType,
      size: typeof body.size === "number" ? body.size : 0,
      uploadedAt: new Date().toISOString(),
      uploadedById: actor.id,
      dataUrl: typeof body.dataUrl === "string" ? body.dataUrl : undefined,
      format:
        body.format != null
          ? (String(body.format).toLowerCase() as Submission["files"][number]["format"])
          : undefined,
    };
    store.updateSubmission(submissionId, { files: [...submission.files, file] });
    store.addActivity({
      submissionId,
      action: "File Uploaded",
      actorId: actor.id,
      actorName: actor.name,
      actorRoles: actor.roles,
      details: `${file.name} (${file.type.replace(/_/g, " ")})`,
      timestamp: file.uploadedAt,
    });
    return {
      id: Number.parseInt(fileId.replace(/\D/g, ""), 10) || toNumericSubmissionId(fileId),
      name: file.name,
      type: rawType,
      size: file.size,
      feedbackKind: body.feedbackKind ? String(body.feedbackKind) : null,
      format: body.format ? String(body.format) : null,
      version: null,
      uploadedById: 0,
      uploadedAt: file.uploadedAt,
    } as T;
  }

  if (path.match(/^\/api\/submissions\/[^/]+\/files\/[^/]+\/download$/) && method === "GET") {
    requireActor();
    const parts = path.split("/");
    const submission = getSubmissionOrThrow(resolveSubmissionId(parts[3]!));
    const file = submission.files.find((f) => f.id === parts[5]!);
    if (!file?.dataUrl) throw new ApiClientError(404, "File not found");
    return { url: file.dataUrl } as T;
  }

  if (path.match(/^\/api\/submissions\/[^/]+\//) && method === "POST") {
    return handleWorkflowPost(path, body) as T;
  }

  if (path === "/api/notifications" && method === "GET") {
    const actor = requireActor();
    return store.notifications
      .filter((n) => n.userId === actor.id)
      .map(notificationToDto) as T;
  }

  if (path.match(/^\/api\/notifications\/[^/]+\/read$/) && method === "PATCH") {
    const actor = requireActor();
    const id = fromNumericNotificationId(path.split("/")[3]!);
    store.markNotificationRead(id);
    const notification = store.notifications.find((n) => n.id === id && n.userId === actor.id);
    if (!notification) throw new ApiClientError(404, "Notification not found");
    return notificationToDto(notification) as T;
  }

  if (path === "/api/settings/payment" && method === "GET") {
    requireActor();
    return paymentSettingsToDto(store.paymentSettings) as T;
  }

  if (path === "/api/settings/payment" && method === "PUT") {
    const actor = requireActor();
    store.updatePaymentSettings(
      {
        enabled: Boolean(body.enabled),
        amount: Number(body.amount),
        currency: String(body.currency ?? "IDR"),
        bankName: String(body.bankName ?? ""),
        accountName: String(body.accountName ?? ""),
        accountNumber: String(body.accountNumber ?? ""),
        transferInstructions:
          typeof body.transferInstructions === "string" ? body.transferInstructions : undefined,
      },
      actor.id,
    );
    return paymentSettingsToDto(store.paymentSettings) as T;
  }

  if (path === "/api/payments/presign" && method === "POST") {
    requireActor();
    return {
      uploadUrl: "demo://upload",
      key: `demo/payments/${Date.now()}/${String(body.filename ?? "proof")}`,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    } as T;
  }

  if (path === "/api/payments" && method === "GET") {
    requireActor();
    const status = String(options.params?.status ?? "APPROVED").toLowerCase();
    return store.payments.filter((p) => p.status === status).map(paymentToDto) as T;
  }

  if (path === "/api/payments" && method === "POST") {
    const actor = requireActor();
    const uploadedAt = new Date().toISOString();
    const result = store.submitPaymentRequest(
      actor.id,
      {
        id: generateId("proof"),
        name: String(body.filename ?? "payment-proof"),
        size: typeof body.size === "number" ? body.size : 1024,
        uploadedAt,
        dataUrl: typeof body.dataUrl === "string" ? body.dataUrl : undefined,
      },
      typeof body.referenceNote === "string" ? body.referenceNote : undefined,
    );
    if (!result.success || !result.payment) {
      throw new ApiClientError(400, result.error ?? "Unable to submit payment");
    }
    registerNewPaymentId(result.payment.id);
    return paymentToDto(result.payment) as T;
  }

  if (path.match(/^\/api\/payments\/[^/]+\/review$/) && method === "POST") {
    const actor = requireActor();
    const paymentId = fromNumericPaymentId(path.split("/")[3]!);
    if (body.approve === true) {
      store.approvePaymentRequest(paymentId, actor.id);
    } else {
      store.rejectPaymentRequest(
        paymentId,
        actor.id,
        typeof body.reason === "string" && body.reason.trim()
          ? body.reason.trim()
          : "Payment proof rejected",
      );
    }
    const payment = store.payments.find((p) => p.id === paymentId);
    if (!payment) throw new ApiClientError(404, "Payment not found");
    return paymentToDto(payment) as T;
  }

  if (path.match(/^\/api\/payments\/[^/]+\/proof\/download$/) && method === "GET") {
    requireActor();
    const paymentId = fromNumericPaymentId(path.split("/")[3]!);
    const payment = store.payments.find((p) => p.id === paymentId);
    if (!payment?.proofFile?.dataUrl) throw new ApiClientError(404, "Proof not found");
    return { url: payment.proofFile.dataUrl } as T;
  }

  if (path === "/api/users/candidates" && method === "GET") {
    requireActor();
    const roleParam = String(options.params?.role ?? "").toUpperCase();
    const role: Role | null =
      roleParam === "HANDLING_EDITOR"
        ? "handling_editor"
        : roleParam === "REVIEWER"
          ? "reviewer"
          : null;
    if (!role) return [] as T;
    return store.users
      .filter((u) => u.status === "active" && u.roles.includes(role))
      .map(userToCandidate) as T;
  }

  if (path === "/api/users" && method === "GET") {
    requireActor();
    return store.users.map(userToDto) as T;
  }

  if (path === "/api/users" && method === "POST") {
    requireActor();
    const user = store.createUser({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      roles: ((body.roles as string[]) ?? []).map((r) => r.toLowerCase() as Role),
      status: "active",
      institution: typeof body.institution === "string" ? body.institution : undefined,
    });
    return userToDto(user) as T;
  }

  if (path.match(/^\/api\/users\/[^/]+\/roles$/) && method === "PATCH") {
    const actor = requireActor();
    const userId = fromNumericUserId(Number(path.split("/")[3])) ?? path.split("/")[3]!;
    store.updateUserRoles(userId, ((body.roles as string[]) ?? []).map((r) => r.toLowerCase() as Role), actor.id);
    const user = store.getUserById(userId);
    if (!user) throw new ApiClientError(404, "User not found");
    return userToDto(user) as T;
  }

  if (path.match(/^\/api\/users\/[^/]+\/status$/) && method === "PATCH") {
    requireActor();
    const userId = fromNumericUserId(Number(path.split("/")[3])) ?? path.split("/")[3]!;
    store.updateUserStatus(userId, String(body.status).toLowerCase() as "active" | "inactive");
    const user = store.getUserById(userId);
    if (!user) throw new ApiClientError(404, "User not found");
    return userToDto(user) as T;
  }

  if (path === "/api/volumes" && method === "GET") {
    requireActor();
    return store.volumes.map(volumeToDto) as T;
  }

  if (path === "/api/volumes" && method === "POST") {
    requireActor();
    const volume = store.addVolume({
      number: Number(body.number),
      year: Number(body.year),
      title: typeof body.title === "string" ? body.title : undefined,
      status: "draft",
    });
    return volumeToDto(volume) as T;
  }

  if (path === "/api/issues" && method === "GET") {
    requireActor();
    const volumeFilter = options.params?.volumeId;
    const issues = store.volumes.flatMap((volume) =>
      volume.issues
        .filter(() => {
          if (volumeFilter == null) return true;
          return String(volumeFilter) === String(toNumericVolumeId(volume.id));
        })
        .map((issue) => issueToDto(issue, volume.id)),
    );
    return issues as T;
  }

  if (path === "/api/issues" && method === "POST") {
    requireActor();
    const volumeId =
      typeof body.volumeId === "string"
        ? body.volumeId
        : resolveVolumeIssueFromBody({ volumeId: body.volumeId }).volumeId;
    if (!volumeId) throw new ApiClientError(400, "Volume is required");
    const issue = store.addIssue(volumeId, {
      number: Number(body.number),
      title: typeof body.title === "string" ? body.title : undefined,
      status: "draft",
      articleIds: [],
    });
    if (!issue) throw new ApiClientError(404, "Volume not found");
    return issueToDto(issue, volumeId) as T;
  }

  if (path === "/api/public/articles" && method === "GET") {
    return listPublicArticleDtos() as T;
  }

  if (path.match(/^\/api\/public\/articles\/[^/]+$/) && method === "GET") {
    const id = resolveSubmissionId(path.split("/").pop()!);
    const state = useJournalStore.getState();
    const article = getPublicPublishedArticles(
      state.submissions,
      state.getUserById,
      state.volumes,
      state.journalSettings,
    ).find((a) => a.id === id);
    if (!article) throw new ApiClientError(404, "Article not found");
    return publicArticleToDto(article) as T;
  }

  throw new ApiClientError(404, `Demo route not implemented: ${method} ${path}`);
}

export function mapStoreUserToAuthUser(user: {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  institution?: string;
  avatarUrl?: string;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    institution: user.institution,
    avatarUrl: user.avatarUrl,
  };
}
