import { create } from "zustand";
import { persist } from "zustand/middleware";
import { routes } from "@/app/routes";
import type { Role } from "@/lib/rbac/types";
import { SEED_DATA, SEED_VERSION, repairProductionAssignments, stripSeedDemoData } from "@/lib/store/seed";
import type {
  ActivityEntry,
  Notification,
  PaymentProofFile,
  PaymentRequest,
  PaymentSettings,
  StoreUser,
  Submission,
  SubmissionFile,
  SubmissionStatus,
  Volume,
  Issue,
} from "@/lib/store/types";
import { getPublicationFiles } from "@/lib/files/submissionFiles";

interface StoreActions {
  authenticate: (email: string, password: string) => StoreUser | null;
  createUser: (user: Omit<StoreUser, "id" | "lastLogin">) => StoreUser;
  registerAuthor: (input: {
    name: string;
    email: string;
    password: string;
    institution?: string;
  }) => { success: boolean; error?: string; user?: StoreUser };
  updateUserRoles: (userId: string, roles: Role[], currentUserId: string) => boolean;
  updateUserStatus: (userId: string, status: StoreUser["status"]) => void;
  updateUserAvatar: (userId: string, avatarUrl?: string) => void;
  resetUserPassword: (userId: string, password: string) => void;
  updateLastLogin: (userId: string) => void;
  getUserById: (id: string) => StoreUser | undefined;
  getUserByEmail: (email: string) => StoreUser | undefined;
  addSubmission: (submission: Submission) => void;
  updateSubmission: (id: string, updates: Partial<Submission>) => void;
  assignHandlingEditor: (
    submissionId: string,
    editorId: string,
    actorId: string,
    actorName: string,
  ) => void;
  assignReviewer: (
    submissionId: string,
    reviewerId: string,
    actorId: string,
    actorName: string,
  ) => void;
  respondToReviewerInvitation: (
    submissionId: string,
    reviewerId: string,
    accept: boolean,
  ) => void;
  recordPlagiarismCheck: (
    submissionId: string,
    actorId: string,
    actorName: string,
    input: {
      status: "passed" | "failed";
      similarityScore?: number;
      notes?: string;
    },
  ) => void;
  submitEditorRecommendation: (
    submissionId: string,
    recommendation: string,
    actorId: string,
    actorName: string,
    notes?: string,
  ) => void;
  assignDoi: (submissionId: string, doi: string, actorId: string, actorName: string) => void;
  addVolume: (volume: Omit<Volume, "id" | "issues"> & { issues?: Volume["issues"] }) => Volume;
  addIssue: (volumeId: string, issue: Omit<Issue, "id" | "volumeId">) => Issue | null;
  updateIssue: (
    volumeId: string,
    issueId: string,
    updates: Partial<Pick<Issue, "title" | "status" | "publishedAt" | "articleIds">>,
  ) => void;
  submitReview: (
    submissionId: string,
    recommendation: string,
    actorId: string,
    actorName: string,
    comments?: string,
    feedbackFiles?: SubmissionFile[],
  ) => void;
  sendForProof: (submissionId: string, actorId: string, actorName: string) => boolean;
  assignLayoutEditor: (
    submissionId: string,
    editorId: string,
    actorId: string,
    actorName: string,
  ) => void;
  startLayout: (submissionId: string, editorId: string, actorName: string) => boolean;
  uploadPublicationFiles: (
    submissionId: string,
    files: SubmissionFile[],
    actorId: string,
    actorName: string,
  ) => boolean;
  saveProductionNotes: (
    submissionId: string,
    notes: string,
    actorId: string,
    actorName: string,
  ) => void;
  updateLayoutChecklist: (
    submissionId: string,
    checklist: Record<string, boolean>,
    actorId: string,
    actorName: string,
  ) => void;
  updateSubmissionStatus: (
    id: string,
    status: SubmissionStatus,
    actorId: string,
    actorName: string,
    details?: string,
    reason?: string,
    feedbackFiles?: SubmissionFile[],
  ) => void;
  addActivity: (entry: Omit<ActivityEntry, "id">) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  markNotificationRead: (id: string) => void;
  getUnreadCount: (userId: string) => number;
  submitPaymentRequest: (
    authorId: string,
    proofFile: PaymentProofFile,
    referenceNote?: string,
  ) => { success: boolean; error?: string; payment?: PaymentRequest };
  approvePaymentRequest: (paymentId: string, reviewerId: string) => boolean;
  rejectPaymentRequest: (paymentId: string, reviewerId: string, reason: string) => boolean;
  updatePaymentSettings: (settings: Omit<PaymentSettings, "updatedAt" | "updatedBy">, updatedBy: string) => void;
  resetStore: () => void;
}

type JournalStore = typeof SEED_DATA & StoreActions;

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
      ...SEED_DATA,

      authenticate: (email, password) => {
        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
        );
        if (!user || user.status === "inactive") return null;
        get().updateLastLogin(user.id);
        return user;
      },

      createUser: (userData) => {
        const newUser: StoreUser = {
          ...userData,
          id: generateId("user"),
          lastLogin: undefined,
        };
        set((state) => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      registerAuthor: (input) => {
        const name = input.name.trim();
        const email = input.email.trim();
        const institution = input.institution?.trim();

        if (!name || !email || !input.password) {
          return { success: false, error: "Name, email, and password are required." };
        }

        if (input.password.length < 6) {
          return { success: false, error: "Password must be at least 6 characters." };
        }

        if (get().users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { success: false, error: "An account with this email already exists." };
        }

        const user = get().createUser({
          name,
          email,
          password: input.password,
          roles: ["author"],
          status: "active",
          institution: institution || undefined,
        });

        get().updateLastLogin(user.id);
        return { success: true, user };
      },

      updateUserRoles: (userId, roles, currentUserId) => {
        if (roles.length === 0) return false;

        const state = get();
        const target = state.users.find((u) => u.id === userId);
        if (!target) return false;

        const isSelf = userId === currentUserId;
        const removingAdmin =
          isSelf &&
          target.roles.includes("publisher_admin") &&
          !roles.includes("publisher_admin");

        if (removingAdmin) {
          const otherAdmins = state.users.filter(
            (u) =>
              u.id !== userId &&
              u.status === "active" &&
              u.roles.includes("publisher_admin"),
          );
          if (otherAdmins.length === 0) return false;
        }

        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, roles } : u)),
        }));
        return true;
      },

      updateUserStatus: (userId, status) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, status } : u)),
        }));
      },

      updateUserAvatar: (userId, avatarUrl) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, avatarUrl: avatarUrl || undefined } : u,
          ),
        }));
      },

      resetUserPassword: (userId, password) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, password } : u)),
        }));
      },

      updateLastLogin: (userId) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, lastLogin: new Date().toISOString() } : u,
          ),
        }));
      },

      getUserById: (id) => get().users.find((u) => u.id === id),

      getUserByEmail: (email) =>
        get().users.find((u) => u.email.toLowerCase() === email.toLowerCase()),

      addSubmission: (submission) => {
        set((state) => ({ submissions: [...state.submissions, submission] }));
      },

      updateSubmission: (id, updates) => {
        set((state) => ({
          submissions: state.submissions.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s,
          ),
        }));
      },

      assignHandlingEditor: (submissionId, editorId, actorId, actorName) => {
        const editor = get().users.find((u) => u.id === editorId);
        const actor = get().users.find((u) => u.id === actorId);
        get().updateSubmission(submissionId, { handlingEditorId: editorId });
        get().addActivity({
          submissionId,
          action: "Handling Editor Assigned",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          details: editor ? "Handling editor assigned" : undefined,
          timestamp: new Date().toISOString(),
        });
      },

      assignReviewer: (submissionId, reviewerId, actorId, actorName) => {
        const reviewer = get().users.find((u) => u.id === reviewerId);
        const actor = get().users.find((u) => u.id === actorId);
        get().updateSubmission(submissionId, {
          pendingReviewerId: reviewerId,
          reviewerInvitationStatus: "pending",
          reviewSubmitted: false,
        });
        get().addActivity({
          submissionId,
          action: "Reviewer Invited",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          details: reviewer ? `Invitation sent to ${reviewer.name}` : undefined,
          timestamp: new Date().toISOString(),
        });
        if (reviewer) {
          get().addNotification({
            userId: reviewer.id,
            title: "Review Invitation",
            message: "You have been invited to review a manuscript. Accept or decline the invitation.",
            read: false,
            createdAt: new Date().toISOString(),
            link: `/dashboard/submissions/${submissionId}`,
          });
        }
      },

      respondToReviewerInvitation: (submissionId, reviewerId, accept) => {
        const submission = get().submissions.find((s) => s.id === submissionId);
        const reviewer = get().users.find((u) => u.id === reviewerId);
        if (
          !submission ||
          submission.pendingReviewerId !== reviewerId ||
          submission.reviewerInvitationStatus !== "pending"
        ) {
          return;
        }

        if (accept) {
          get().updateSubmission(submissionId, {
            reviewerId,
            pendingReviewerId: undefined,
            reviewerInvitationStatus: "accepted",
            status: "under_review",
          });
          get().addActivity({
            submissionId,
            action: "Review Invitation Accepted",
            actorId: reviewerId,
            actorName: reviewer?.name ?? "Reviewer",
            actorRoles: reviewer?.roles,
            statusAfter: "under_review",
            timestamp: new Date().toISOString(),
          });
        } else {
          get().updateSubmission(submissionId, {
            pendingReviewerId: undefined,
            reviewerInvitationStatus: "declined",
          });
          get().addActivity({
            submissionId,
            action: "Review Invitation Declined",
            actorId: reviewerId,
            actorName: reviewer?.name ?? "Reviewer",
            actorRoles: reviewer?.roles,
            timestamp: new Date().toISOString(),
          });
          if (submission.handlingEditorId) {
            get().addNotification({
              userId: submission.handlingEditorId,
              title: "Review Invitation Declined",
              message: `${reviewer?.name ?? "A reviewer"} declined the review invitation.`,
              read: false,
              createdAt: new Date().toISOString(),
              link: `/dashboard/submissions/${submissionId}`,
            });
          }
        }
      },

      recordPlagiarismCheck: (submissionId, actorId, actorName, input) => {
        const actor = get().users.find((u) => u.id === actorId);
        const now = new Date().toISOString();
        get().updateSubmission(submissionId, {
          plagiarismStatus: input.status,
          similarityScore: input.similarityScore,
          plagiarismNotes: input.notes?.trim() || undefined,
          plagiarismCheckedAt: now,
          plagiarismCheckedBy: actorId,
        });
        get().addActivity({
          submissionId,
          action: input.status === "passed" ? "Plagiarism Check Passed" : "Plagiarism Check Failed",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          details: [
            input.similarityScore !== undefined ? `Similarity: ${input.similarityScore}%` : null,
            input.notes?.trim(),
          ]
            .filter(Boolean)
            .join(". "),
          timestamp: now,
        });
      },

      submitEditorRecommendation: (submissionId, recommendation, actorId, actorName, notes) => {
        const actor = get().users.find((u) => u.id === actorId);
        const now = new Date().toISOString();
        const trimmedNotes = notes?.trim();
        get().updateSubmission(submissionId, {
          editorRecommendation: recommendation,
          editorRecommendationNotes: trimmedNotes,
          editorRecommendationAt: now,
        });
        get().addActivity({
          submissionId,
          action: "Editorial Recommendation Submitted",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          details: trimmedNotes
            ? `Recommendation: ${recommendation.replace(/_/g, " ")}. ${trimmedNotes}`
            : `Recommendation: ${recommendation.replace(/_/g, " ")}`,
          timestamp: now,
        });
        const submission = get().submissions.find((s) => s.id === submissionId);
        if (submission) {
          get()
            .users.filter((u) => u.status === "active" && u.roles.includes("editor_in_chief"))
            .forEach((eic) => {
              get().addNotification({
                userId: eic.id,
                title: "Editorial Recommendation Ready",
                message: `${submission.submissionNumber} has a new handling editor recommendation.`,
                read: false,
                createdAt: now,
                link: `/dashboard/editorial-decision`,
              });
            });
        }
      },

      assignDoi: (submissionId, doi, actorId, actorName) => {
        const actor = get().users.find((u) => u.id === actorId);
        const trimmed = doi.trim();
        if (!trimmed) return;
        get().updateSubmission(submissionId, { doi: trimmed });
        get().addActivity({
          submissionId,
          action: "DOI Assigned",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          details: trimmed,
          timestamp: new Date().toISOString(),
        });
      },

      addVolume: (volumeData) => {
        const newVolume: Volume = {
          ...volumeData,
          id: generateId("vol"),
          issues: volumeData.issues ?? [],
        };
        set((state) => ({ volumes: [...state.volumes, newVolume] }));
        return newVolume;
      },

      addIssue: (volumeId, issueData) => {
        const volume = get().volumes.find((v) => v.id === volumeId);
        if (!volume) return null;
        const newIssue: Issue = {
          ...issueData,
          id: generateId("issue"),
          volumeId,
        };
        set((state) => ({
          volumes: state.volumes.map((v) =>
            v.id === volumeId ? { ...v, issues: [...v.issues, newIssue] } : v,
          ),
        }));
        return newIssue;
      },

      updateIssue: (volumeId, issueId, updates) => {
        set((state) => ({
          volumes: state.volumes.map((v) =>
            v.id === volumeId
              ? {
                  ...v,
                  issues: v.issues.map((issue) =>
                    issue.id === issueId ? { ...issue, ...updates } : issue,
                  ),
                }
              : v,
          ),
        }));
      },

      submitReview: (submissionId, recommendation, actorId, actorName, comments, feedbackFiles) => {
        const actor = get().users.find((u) => u.id === actorId);
        const trimmedComments = comments?.trim();
        const submission = get().submissions.find((s) => s.id === submissionId);
        get().updateSubmission(submissionId, {
          reviewSubmitted: true,
          ...(trimmedComments ? { reviewComments: trimmedComments } : {}),
          ...(feedbackFiles?.length
            ? { files: [...(submission?.files ?? []), ...feedbackFiles] }
            : {}),
        });
        get().addActivity({
          submissionId,
          action: "Review Submitted",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          details: trimmedComments
            ? `Recommendation: ${recommendation.replace(/_/g, " ")}. Comments: ${trimmedComments}`
            : `Recommendation: ${recommendation.replace(/_/g, " ")}`,
          timestamp: new Date().toISOString(),
        });
      },

      sendForProof: (submissionId, actorId, actorName) => {
        const actor = get().users.find((u) => u.id === actorId);
        const submission = get().submissions.find((s) => s.id === submissionId);
        if (!submission) return false;

        const publicationFiles = getPublicationFiles(submission.files);
        if (publicationFiles.length === 0) return false;

        const now = new Date().toISOString();
        get().updateSubmission(submissionId, { proofReady: true, proofApproved: false });
        get().addActivity({
          submissionId,
          action: "Marked Ready for Proofreading",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          statusAfter: "production",
          timestamp: now,
        });
        get().addNotification({
          userId: submission.authorId,
          title: "Proof Ready",
          message: `Your manuscript proof for ${submission.submissionNumber} is ready for review.`,
          read: false,
          createdAt: now,
          link: routes.submissionById(submissionId),
        });
        if (submission.handlingEditorId) {
          get().addNotification({
            userId: submission.handlingEditorId,
            title: "Layout Ready for Proofreading",
            message: `${submission.submissionNumber} has been sent to the author for proofreading.`,
            read: false,
            createdAt: now,
            link: routes.submissionById(submissionId),
          });
        }
        return true;
      },

      assignLayoutEditor: (submissionId, editorId, actorId, actorName) => {
        const editor = get().users.find((u) => u.id === editorId);
        const actor = get().users.find((u) => u.id === actorId);
        const submission = get().submissions.find((s) => s.id === submissionId);
        const now = new Date().toISOString();

        get().updateSubmission(submissionId, {
          layoutEditorId: editorId,
          layoutAssignedAt: now,
        });
        get().addActivity({
          submissionId,
          action: "Assigned to Layout Editor",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          statusAfter: submission?.status,
          details: editor ? `Assigned to ${editor.name}` : undefined,
          timestamp: now,
        });
        if (editor) {
          get().addNotification({
            userId: editor.id,
            title: "Layout Assignment",
            message: `${submission?.submissionNumber ?? "A submission"} has been assigned to you for layout.`,
            read: false,
            createdAt: now,
            link: routes.submissionById(submissionId),
          });
        }
      },

      startLayout: (submissionId, editorId, actorName) => {
        const submission = get().submissions.find((s) => s.id === submissionId);
        const editor = get().users.find((u) => u.id === editorId);
        if (!submission || submission.status !== "production" || submission.proofReady) {
          return false;
        }

        if (
          submission.layoutEditorId &&
          submission.layoutEditorId !== editorId
        ) {
          return false;
        }

        const now = new Date().toISOString();
        get().updateSubmission(submissionId, {
          layoutEditorId: submission.layoutEditorId ?? editorId,
          layoutAssignedAt: submission.layoutAssignedAt ?? now,
          layoutStartedAt: now,
        });
        get().addActivity({
          submissionId,
          action: "Layout editing started",
          actorId: editorId,
          actorName,
          actorRoles: editor?.roles,
          statusAfter: "production",
          timestamp: now,
        });
        return true;
      },

      uploadPublicationFiles: (submissionId, files, actorId, actorName) => {
        const submission = get().submissions.find((s) => s.id === submissionId);
        const actor = get().users.find((u) => u.id === actorId);
        if (!submission || files.length === 0) return false;

        const now = new Date().toISOString();
        get().updateSubmission(submissionId, {
          files: [...submission.files, ...files],
        });

        for (const file of files) {
          get().addActivity({
            submissionId,
            action: "Uploaded publication file",
            actorId,
            actorName,
            actorRoles: actor?.roles,
            statusAfter: "production",
            details: `${file.name} (${file.format ?? "file"}, v${file.version ?? 1})`,
            timestamp: now,
          });
        }

        if (submission.handlingEditorId) {
          get().addNotification({
            userId: submission.handlingEditorId,
            title: "Publication Files Uploaded",
            message: `${submission.submissionNumber}: ${files.length} publication file(s) uploaded.`,
            read: false,
            createdAt: now,
            link: routes.submissionById(submissionId),
          });
        }

        return true;
      },

      saveProductionNotes: (submissionId, notes, actorId, actorName) => {
        const actor = get().users.find((u) => u.id === actorId);
        const trimmed = notes.trim();
        const now = new Date().toISOString();

        get().updateSubmission(submissionId, {
          productionNotes: trimmed || undefined,
        });
        get().addActivity({
          submissionId,
          action: "Added production notes",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          statusAfter: "production",
          details: trimmed ? trimmed.slice(0, 120) : undefined,
          timestamp: now,
        });
      },

      updateLayoutChecklist: (submissionId, checklist, actorId, actorName) => {
        const actor = get().users.find((u) => u.id === actorId);
        const now = new Date().toISOString();

        get().updateSubmission(submissionId, { layoutChecklist: checklist });
        get().addActivity({
          submissionId,
          action: "Updated layout checklist",
          actorId,
          actorName,
          actorRoles: actor?.roles,
          statusAfter: "production",
          timestamp: now,
        });
      },

      updateSubmissionStatus: (id, status, actorId, actorName, details, reason, feedbackFiles) => {
        const actor = get().users.find((u) => u.id === actorId);
        const trimmedReason = reason?.trim();
        const needsReason = status === "revision_required" || status === "rejected";
        const submission = get().submissions.find((s) => s.id === id);
        const now = new Date().toISOString();

        get().updateSubmission(id, {
          status,
          ...(status === "published" ? { publishedAt: now } : {}),
          ...(needsReason && trimmedReason ? { decisionReason: trimmedReason } : {}),
          ...(feedbackFiles?.length
            ? { files: [...(submission?.files ?? []), ...feedbackFiles] }
            : {}),
        });
        get().addActivity({
          submissionId: id,
          action: `Status changed to ${status.replace(/_/g, " ")}`,
          actorId,
          actorName,
          actorRoles: actor?.roles,
          statusAfter: status,
          timestamp: now,
          details: trimmedReason ? `${details ?? ""}${details ? ". " : ""}Reason: ${trimmedReason}` : details,
        });

        if (needsReason && submission) {
          get().addNotification({
            userId: submission.authorId,
            title: status === "rejected" ? "Submission Rejected" : "Revision Requested",
            message:
              trimmedReason ??
              (status === "rejected"
                ? "Your submission has been rejected."
                : "Please revise and resubmit your manuscript."),
            read: false,
            createdAt: now,
            link: `/dashboard/submissions/${id}`,
          });
        }

        if (status === "accepted" && submission) {
          get()
            .users.filter((u) => u.status === "active" && u.roles.includes("copyeditor"))
            .forEach((copyeditor) => {
              get().addNotification({
                userId: copyeditor.id,
                title: "Copyediting Queue",
                message: `${submission.submissionNumber} has been accepted and awaits copyediting.`,
                read: false,
                createdAt: now,
                link: routes.submissionById(id),
              });
            });
        }

        if (status === "production" && submission) {
          if (!submission.layoutEditorId) {
            const layoutEditor = get().users.find(
              (u) => u.status === "active" && u.roles.includes("layout_editor"),
            );
            if (layoutEditor) {
              get().assignLayoutEditor(id, layoutEditor.id, actorId, actorName);
            }
          } else {
            const layoutEditor = get().users.find((u) => u.id === submission.layoutEditorId);
            if (layoutEditor) {
              get().addNotification({
                userId: layoutEditor.id,
                title: "Layout Queue",
                message: `${submission.submissionNumber} copyedited manuscript is ready for layout.`,
                read: false,
                createdAt: now,
                link: routes.submissionById(id),
              });
            }
          }
        }
      },

      addActivity: (entry) => {
        set((state) => ({
          activities: [{ ...entry, id: generateId("act") }, ...state.activities],
        }));
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [{ ...notification, id: generateId("notif") }, ...state.notifications],
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }));
      },

      getUnreadCount: (userId) =>
        get().notifications.filter((n) => n.userId === userId && !n.read).length,

      submitPaymentRequest: (authorId, proofFile, referenceNote) => {
        const state = get();
        const author = state.users.find((u) => u.id === authorId);
        if (!author) return { success: false, error: "Author not found." };

        const hasBlocking = state.payments.some(
          (payment) =>
            payment.authorId === authorId &&
            (payment.status === "pending_review" || payment.status === "approved"),
        );
        if (hasBlocking) {
          return { success: false, error: "You already have a pending or approved payment." };
        }

        const payment: PaymentRequest = {
          id: generateId("pay"),
          authorId,
          amount: state.paymentSettings.amount,
          currency: state.paymentSettings.currency,
          status: "pending_review",
          proofFile,
          referenceNote: referenceNote?.trim() || undefined,
          submittedAt: new Date().toISOString(),
        };

        set((s) => ({ payments: [payment, ...s.payments] }));

        get().addActivity({
          submissionId: "payment",
          paymentId: payment.id,
          action: "Payment Proof Submitted",
          actorId: authorId,
          actorName: author.name,
          actorRoles: author.roles,
          timestamp: payment.submittedAt,
          details: referenceNote?.trim()
            ? `Reference: ${referenceNote.trim()}`
            : "Transfer proof uploaded for review",
        });

        state.users
          .filter(
            (u) => u.status === "active" && u.roles.includes("publisher_admin"),
          )
          .forEach((admin) => {
            get().addNotification({
              userId: admin.id,
              title: "New Payment Proof",
              message: `New payment proof from ${author.name}.`,
              read: false,
              createdAt: payment.submittedAt,
              link: "/dashboard/payments",
            });
          });

        return { success: true, payment };
      },

      approvePaymentRequest: (paymentId, reviewerId) => {
        const state = get();
        const payment = state.payments.find((p) => p.id === paymentId);
        const reviewer = state.users.find((u) => u.id === reviewerId);
        const author = payment ? state.users.find((u) => u.id === payment.authorId) : undefined;

        if (!payment || payment.status !== "pending_review" || !reviewer || !author) {
          return false;
        }

        const reviewedAt = new Date().toISOString();

        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === paymentId
              ? { ...p, status: "approved", reviewedAt, reviewedBy: reviewerId }
              : p,
          ),
        }));

        get().addActivity({
          submissionId: "payment",
          paymentId: payment.id,
          action: "Payment Approved",
          actorId: reviewerId,
          actorName: reviewer.name,
          actorRoles: reviewer.roles,
          timestamp: reviewedAt,
          details: "Submission access unlocked for author",
        });

        get().addNotification({
          userId: author.id,
          title: "Payment Approved",
          message: "Your payment has been approved. You can now submit manuscripts.",
          read: false,
          createdAt: reviewedAt,
          link: "/dashboard/submissions/new",
        });

        return true;
      },

      rejectPaymentRequest: (paymentId, reviewerId, reason) => {
        const state = get();
        const payment = state.payments.find((p) => p.id === paymentId);
        const reviewer = state.users.find((u) => u.id === reviewerId);
        const author = payment ? state.users.find((u) => u.id === payment.authorId) : undefined;
        const trimmedReason = reason.trim();

        if (
          !payment ||
          payment.status !== "pending_review" ||
          !reviewer ||
          !author ||
          !trimmedReason
        ) {
          return false;
        }

        const reviewedAt = new Date().toISOString();

        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  status: "rejected",
                  reviewedAt,
                  reviewedBy: reviewerId,
                  rejectionReason: trimmedReason,
                }
              : p,
          ),
        }));

        get().addActivity({
          submissionId: "payment",
          paymentId: payment.id,
          action: "Payment Rejected",
          actorId: reviewerId,
          actorName: reviewer.name,
          actorRoles: reviewer.roles,
          timestamp: reviewedAt,
          details: trimmedReason,
        });

        get().addNotification({
          userId: author.id,
          title: "Payment Rejected",
          message: trimmedReason,
          read: false,
          createdAt: reviewedAt,
          link: "/dashboard/payment",
        });

        return true;
      },

      updatePaymentSettings: (settings, updatedBy) => {
        set({
          paymentSettings: {
            ...settings,
            updatedAt: new Date().toISOString(),
            updatedBy,
          },
        });
      },

      resetStore: () => set({ ...SEED_DATA }),
    }),
    {
      name: "journal-platform-store",
      version: SEED_VERSION,
      migrate: (persistedState, version) => {
        if (version < SEED_VERSION) {
          const state = persistedState as Partial<typeof SEED_DATA>;
          const base =
            version >= 2
              ? repairProductionAssignments(
                  stripSeedDemoData({
                  ...SEED_DATA,
                  ...state,
                  users: state.users ?? SEED_DATA.users,
                  submissions: state.submissions ?? SEED_DATA.submissions,
                  activities: state.activities ?? SEED_DATA.activities,
                  notifications: state.notifications ?? SEED_DATA.notifications,
                  volumes: state.volumes ?? SEED_DATA.volumes,
                  journalSettings: state.journalSettings ?? SEED_DATA.journalSettings,
                  payments: state.payments ?? SEED_DATA.payments,
                  paymentSettings: state.paymentSettings ?? SEED_DATA.paymentSettings,
                } as typeof SEED_DATA),
                )
              : repairProductionAssignments({ ...SEED_DATA });
          return base;
        }
        return persistedState as typeof SEED_DATA;
      },
      partialize: (state) => ({
        users: state.users,
        submissions: state.submissions,
        activities: state.activities,
        notifications: state.notifications,
        volumes: state.volumes,
        journalSettings: state.journalSettings,
        payments: state.payments,
        paymentSettings: state.paymentSettings,
      }),
    },
  ),
);
