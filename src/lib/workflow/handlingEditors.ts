import type { Submission } from "@/lib/store/types";

export function getHandlingEditorIds(
  submission: Pick<Submission, "handlingEditorIds" | "handlingEditorId">,
): string[] {
  if (submission.handlingEditorIds?.length) {
    return submission.handlingEditorIds;
  }
  if (submission.handlingEditorId) {
    return [submission.handlingEditorId];
  }
  return [];
}

export function hasHandlingEditors(
  submission: Pick<Submission, "handlingEditorIds" | "handlingEditorId">,
): boolean {
  return getHandlingEditorIds(submission).length > 0;
}

export function isHandlingEditorOnSubmission(
  submission: Pick<Submission, "handlingEditorIds" | "handlingEditorId">,
  userId: string,
): boolean {
  return getHandlingEditorIds(submission).includes(userId);
}

export function getHandlingEditorNames(
  submission: Pick<Submission, "handlingEditorIds" | "handlingEditorId" | "handlingEditorName">,
  getUserById: (id: string) => { name: string } | undefined,
): string[] {
  return getHandlingEditorIds(submission).map(
    (id) => getUserById(id)?.name ?? submission.handlingEditorName ?? "Assigned",
  );
}
