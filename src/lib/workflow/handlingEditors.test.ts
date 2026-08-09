import { describe, expect, it } from "vitest";
import type { Submission } from "@/lib/store/types";
import {
  getHandlingEditorIds,
  isHandlingEditorOnSubmission,
} from "@/lib/workflow/handlingEditors";

describe("handlingEditors", () => {
  it("reads legacy single handlingEditorId", () => {
    const submission = { handlingEditorId: "user-he" } as Submission;
    expect(getHandlingEditorIds(submission)).toEqual(["user-he"]);
    expect(isHandlingEditorOnSubmission(submission, "user-he")).toBe(true);
  });

  it("reads handlingEditorIds array for multi-assign", () => {
    const submission = {
      handlingEditorId: "user-he",
      handlingEditorIds: ["user-he", "user-he2"],
    } as Submission;
    expect(getHandlingEditorIds(submission)).toEqual(["user-he", "user-he2"]);
    expect(isHandlingEditorOnSubmission(submission, "user-he2")).toBe(true);
  });
});
