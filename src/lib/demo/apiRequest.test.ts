import { beforeEach, describe, expect, it } from "vitest";
import { tokenStorage } from "@/lib/api/tokenStorage";
import { authStorage } from "@/features/auth/storage";
import { useJournalStore } from "@/lib/store/store";
import { SEED_DATA } from "@/lib/store/seed";
import { demoApiRequest } from "@/lib/demo/apiRequest";
import { mapSubmissionDto, submissionsApi } from "@/lib/api/submissions";
import { uploadSubmissionFiles } from "@/lib/api/files";
import { workflowApi } from "@/lib/api/workflow";
import { isHandlingEditorOnSubmission } from "@/lib/workflow/handlingEditors";

describe("demo handling editor assignment", () => {
  beforeEach(() => {
    useJournalStore.setState({ ...SEED_DATA });
    tokenStorage.save({
      accessToken: "demo-access-user-eic",
      refreshToken: "demo-refresh-user-eic",
    });
    authStorage.save({
      id: "user-eic",
      name: "Prof. Chief Editor",
      email: "eic@journal.com",
      roles: ["editor_in_chief"],
    });
  });

  it("assigns multiple handling editors and exposes them in the submission list", async () => {
    await workflowApi.assignEditor("sub-001", ["user-he2", "user-he3"]);

    const list = await submissionsApi.list();
    const submission = list.find((entry) => entry.id === "sub-001");

    expect(submission?.status).toBe("assigned");
    expect(submission?.handlingEditorIds).toEqual(
      expect.arrayContaining(["user-he2", "user-he3"]),
    );

    const editor2Submissions = list.filter((entry) =>
      isHandlingEditorOnSubmission(entry, "user-he2"),
    );
    expect(editor2Submissions.some((entry) => entry.id === "sub-001")).toBe(true);
  });
});

describe("demo production workflow", () => {
  beforeEach(() => {
    useJournalStore.setState({
      ...SEED_DATA,
      submissions: SEED_DATA.submissions.map((submission) =>
        submission.id === "sub-008"
          ? {
              ...submission,
              status: "production" as const,
              acceptancePaymentVerified: true,
            }
          : submission,
      ),
    });
    tokenStorage.save({
      accessToken: "demo-access-user-production",
      refreshToken: "demo-refresh-user-production",
    });
    authStorage.save({
      id: "user-production",
      name: "Pat Production",
      email: "production@journal.com",
      roles: ["production_editor"],
    });
  });

  it("blocks layout until publication payment is verified", async () => {
    useJournalStore.setState({
      ...SEED_DATA,
      submissions: SEED_DATA.submissions.map((submission) =>
        submission.id === "sub-008"
          ? { ...submission, status: "payment_pending" as const, acceptancePaymentVerified: false }
          : submission,
      ),
    });

    await expect(workflowApi.startLayout("sub-008")).rejects.toMatchObject({
      message: "Publication payment must be verified before layout can begin.",
    });
  });

  it("starts layout after publication payment is verified", async () => {
    await workflowApi.startLayout("sub-008");

    const dto = await demoApiRequest<Awaited<ReturnType<typeof demoApiRequest>>>(
      "/api/submissions/sub-008",
      { method: "GET" },
    );
    const submission = mapSubmissionDto(dto as never);

    expect(submission.status).toBe("production");
    expect(submission.layoutStartedAt).toBeTruthy();
  });

  it("uploads publication files and sends for author proof", async () => {
    await workflowApi.startLayout("sub-008");

    const file = new File(["publication content"], "article.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    await uploadSubmissionFiles("sub-008", [file], "PUBLICATION", { format: "OTHER" });

    const submission = await workflowApi.sendForProof("sub-008");
    expect(submission.proofReady).toBe(true);
  });

  it("rejects send for proof without a publication file", async () => {
    await workflowApi.startLayout("sub-008");

    await expect(workflowApi.sendForProof("sub-008")).rejects.toMatchObject({
      message: "Upload at least one publication file before sending for author proof.",
    });
  });
});

describe("demo payment proof submit", () => {
  beforeEach(() => {
    useJournalStore.setState({ ...SEED_DATA });
    tokenStorage.save({
      accessToken: "demo-access-user-author",
      refreshToken: "demo-refresh-user-author",
    });
    authStorage.save({
      id: "user-author",
      name: "Dr. Jane Author",
      email: "author@journal.com",
      roles: ["author"],
    });
  });

  it("presigns and submits payment proof with file metadata", async () => {
    const presigned = await demoApiRequest<{ uploadUrl: string; key: string }>(
      "/api/payments/presign",
      { method: "POST", body: { filename: "transfer.jpg", contentType: "image/jpeg" } },
    );
    expect(presigned.uploadUrl).toBe("demo://upload");
    expect(presigned.key).toContain("demo/payments/");

    const payment = await demoApiRequest<{ status: string; referenceNote: string | null }>(
      "/api/payments",
      {
        method: "POST",
        body: {
          key: presigned.key,
          referenceNote: "TRX-12345",
          filename: "transfer.jpg",
          size: 2048,
          dataUrl: "data:image/jpeg;base64,abc",
        },
      },
    );
    expect(payment.status).toBe("pending_review");
    expect(payment.referenceNote).toBe("TRX-12345");

    const stored = useJournalStore.getState().payments.find((p) => p.authorId === "user-author");
    expect(stored?.proofFile.name).toBe("transfer.jpg");
    expect(stored?.proofFile.size).toBe(2048);
    expect(stored?.proofFile.dataUrl).toBe("data:image/jpeg;base64,abc");
  });
});
