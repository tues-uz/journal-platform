import { describe, expect, it, vi } from "vitest";
import {
  canBeginLayoutProduction,
  getSubmissionApcState,
  hasApprovedPayment,
  isApcRequired,
  isPureAuthor,
} from "@/lib/payment/access";
import type { PaymentRequest } from "@/lib/store/types";

vi.mock("@/lib/demo/mode", () => ({
  isDemoMode: vi.fn(() => false),
}));

const approvedPayment: PaymentRequest = {
  id: "pay-1",
  authorId: "author-1",
  amount: 500000,
  currency: "IDR",
  status: "approved",
  proofFile: {
    id: "proof-1",
    name: "receipt.png",
    size: 1000,
    uploadedAt: "2026-07-01T10:00:00Z",
  },
  submittedAt: "2026-07-01T10:00:00Z",
};

describe("isPureAuthor", () => {
  it("returns true for author-only users", () => {
    expect(isPureAuthor(["author"])).toBe(true);
  });

  it("returns false when author also has staff roles", () => {
    expect(isPureAuthor(["author", "editorial_staff"])).toBe(false);
  });

  it("returns false for staff without author role", () => {
    expect(isPureAuthor(["publisher_admin"])).toBe(false);
  });
});

describe("hasApprovedPayment", () => {
  it("returns true when author has approved payment", () => {
    expect(hasApprovedPayment("author-1", [approvedPayment])).toBe(true);
  });

  it("returns false when payment is pending or rejected", () => {
    expect(
      hasApprovedPayment("author-1", [{ ...approvedPayment, status: "pending_review" }]),
    ).toBe(false);
    expect(
      hasApprovedPayment("author-1", [{ ...approvedPayment, status: "rejected" }]),
    ).toBe(false);
  });
});

describe("isApcRequired", () => {
  it("is false in demo mode even when payments are enabled", async () => {
    const { isDemoMode } = await import("@/lib/demo/mode");
    vi.mocked(isDemoMode).mockReturnValueOnce(true);
    expect(isApcRequired({ enabled: true })).toBe(false);
  });

  it("follows payment settings outside demo mode", async () => {
    const { isDemoMode } = await import("@/lib/demo/mode");
    vi.mocked(isDemoMode).mockReturnValue(false);
    expect(isApcRequired({ enabled: true })).toBe(true);
    expect(isApcRequired({ enabled: false })).toBe(false);
  });
});

describe("getSubmissionApcState", () => {
  const submission = {
    status: "payment_pending" as const,
    acceptancePaymentVerified: false,
    authorId: "author-1",
  };

  it("returns paid when acceptance is verified on the submission", () => {
    expect(
      getSubmissionApcState(
        { ...submission, acceptancePaymentVerified: true },
        [],
      ),
    ).toBe("paid");
  });

  it("returns pending_review when author proof awaits admin review", () => {
    expect(
      getSubmissionApcState(submission, [
        { ...approvedPayment, status: "pending_review", authorId: "author-1" },
      ]),
    ).toBe("pending_review");
  });

  it("returns paid when author has approved payment but submission is stale", () => {
    expect(getSubmissionApcState(submission, [approvedPayment])).toBe("paid");
  });

  it("returns due when no payment proof exists", () => {
    expect(getSubmissionApcState(submission, [])).toBe("due");
  });
});

describe("canBeginLayoutProduction", () => {
  it("requires verified production status when APC is required", () => {
    const settings = { enabled: true as const };
    expect(
      canBeginLayoutProduction(
        { status: "production", acceptancePaymentVerified: true, proofReady: false },
        settings,
      ),
    ).toBe(true);

    expect(
      canBeginLayoutProduction(
        { status: "payment_pending", acceptancePaymentVerified: false, proofReady: false },
        settings,
      ),
    ).toBe(false);

    expect(
      canBeginLayoutProduction(
        { status: "production", acceptancePaymentVerified: false, proofReady: false },
        settings,
      ),
    ).toBe(false);
  });

  it("allows accepted manuscripts when APC is not required", () => {
    expect(
      canBeginLayoutProduction(
        { status: "accepted", acceptancePaymentVerified: false, proofReady: false },
        { enabled: false },
      ),
    ).toBe(true);
  });
});
