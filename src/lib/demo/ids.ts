import { useJournalStore } from "@/lib/store/store";

const userToNumeric = new Map<string, number>();
const numericToUser = new Map<number, string>();
const submissionToNumeric = new Map<string, number>();
const numericToSubmission = new Map<number, string>();
const volumeToNumeric = new Map<string, number>();
const numericToVolume = new Map<number, string>();
const issueToNumeric = new Map<string, number>();
const numericToIssue = new Map<number, string>();
const paymentToNumeric = new Map<string, number>();
const numericToPayment = new Map<number, string>();
const notificationToNumeric = new Map<string, number>();
const numericToNotification = new Map<number, string>();
const activityToNumeric = new Map<string, number>();
const numericToActivity = new Map<number, string>();

let initialized = false;
let nextNumericId = 1000;

function registerEntity(
  stringId: string,
  toNumeric: Map<string, number>,
  fromNumeric: Map<number, string>,
) {
  if (toNumeric.has(stringId)) return;
  const numericId = nextNumericId++;
  toNumeric.set(stringId, numericId);
  fromNumeric.set(numericId, stringId);
}

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  const state = useJournalStore.getState();
  for (const user of state.users) registerEntity(user.id, userToNumeric, numericToUser);
  for (const submission of state.submissions) {
    registerEntity(submission.id, submissionToNumeric, numericToSubmission);
  }
  for (const volume of state.volumes) {
    registerEntity(volume.id, volumeToNumeric, numericToVolume);
    for (const issue of volume.issues) {
      registerEntity(issue.id, issueToNumeric, numericToIssue);
    }
  }
  for (const payment of state.payments) {
    registerEntity(payment.id, paymentToNumeric, numericToPayment);
  }
  for (const notification of state.notifications) {
    registerEntity(notification.id, notificationToNumeric, numericToNotification);
  }
  for (const activity of state.activities) {
    registerEntity(activity.id, activityToNumeric, numericToActivity);
  }
}

export function toNumericUserId(id: string): number {
  ensureInitialized();
  registerEntity(id, userToNumeric, numericToUser);
  return userToNumeric.get(id)!;
}

export function fromNumericUserId(id: number | string | undefined | null): string | undefined {
  if (id == null) return undefined;
  ensureInitialized();
  if (typeof id === "string" && userToNumeric.has(id)) return id;
  const numeric = typeof id === "number" ? id : Number(id);
  if (Number.isNaN(numeric)) return typeof id === "string" ? id : undefined;
  return numericToUser.get(numeric) ?? (typeof id === "string" ? id : undefined);
}

export function toNumericSubmissionId(id: string): number {
  ensureInitialized();
  registerEntity(id, submissionToNumeric, numericToSubmission);
  return submissionToNumeric.get(id)!;
}

export function resolveSubmissionId(id: string): string {
  ensureInitialized();
  if (useJournalStore.getState().submissions.some((s) => s.id === id)) return id;
  const numeric = Number(id);
  if (!Number.isNaN(numeric)) {
    return numericToSubmission.get(numeric) ?? id;
  }
  return id;
}

export function fromNumericSubmissionId(id: number | string): string {
  if (typeof id === "string" && submissionToNumeric.has(id)) return id;
  const numeric = typeof id === "number" ? id : Number(id);
  if (!Number.isNaN(numeric)) {
    const resolved = numericToSubmission.get(numeric);
    if (resolved) return resolved;
  }
  return String(id);
}

export function toNumericVolumeId(id: string): number {
  ensureInitialized();
  registerEntity(id, volumeToNumeric, numericToVolume);
  return volumeToNumeric.get(id)!;
}

export function fromNumericVolumeId(id: number | string | undefined | null): string | undefined {
  if (id == null) return undefined;
  ensureInitialized();
  if (typeof id === "string" && volumeToNumeric.has(id)) return id;
  const numeric = typeof id === "number" ? id : Number(id);
  if (Number.isNaN(numeric)) return typeof id === "string" ? id : undefined;
  return numericToVolume.get(numeric) ?? (typeof id === "string" ? id : undefined);
}

export function toNumericIssueId(id: string): number {
  ensureInitialized();
  registerEntity(id, issueToNumeric, numericToIssue);
  return issueToNumeric.get(id)!;
}

export function fromNumericIssueId(id: number | string | undefined | null): string | undefined {
  if (id == null) return undefined;
  ensureInitialized();
  if (typeof id === "string" && issueToNumeric.has(id)) return id;
  const numeric = typeof id === "number" ? id : Number(id);
  if (Number.isNaN(numeric)) return typeof id === "string" ? id : undefined;
  return numericToIssue.get(numeric) ?? (typeof id === "string" ? id : undefined);
}

export function toNumericPaymentId(id: string): number {
  ensureInitialized();
  registerEntity(id, paymentToNumeric, numericToPayment);
  return paymentToNumeric.get(id)!;
}

export function fromNumericPaymentId(id: number | string): string {
  if (typeof id === "string" && paymentToNumeric.has(id)) return id;
  const numeric = typeof id === "number" ? id : Number(id);
  if (!Number.isNaN(numeric)) {
    const resolved = numericToPayment.get(numeric);
    if (resolved) return resolved;
  }
  return String(id);
}

export function toNumericNotificationId(id: string): number {
  ensureInitialized();
  registerEntity(id, notificationToNumeric, numericToNotification);
  return notificationToNumeric.get(id)!;
}

export function fromNumericNotificationId(id: number | string): string {
  if (typeof id === "string" && notificationToNumeric.has(id)) return id;
  const numeric = typeof id === "number" ? id : Number(id);
  if (!Number.isNaN(numeric)) {
    const resolved = numericToNotification.get(numeric);
    if (resolved) return resolved;
  }
  return String(id);
}

export function registerNewSubmissionId(id: string) {
  ensureInitialized();
  registerEntity(id, submissionToNumeric, numericToSubmission);
}

export function registerNewPaymentId(id: string) {
  ensureInitialized();
  registerEntity(id, paymentToNumeric, numericToPayment);
}

export function registerNewNotificationId(id: string) {
  ensureInitialized();
  registerEntity(id, notificationToNumeric, numericToNotification);
}

export function toNumericActivityId(id: string): number {
  ensureInitialized();
  registerEntity(id, activityToNumeric, numericToActivity);
  return activityToNumeric.get(id)!;
}

export function registerNewActivityId(id: string) {
  ensureInitialized();
  registerEntity(id, activityToNumeric, numericToActivity);
}
