import { describe, expect, it } from "vitest";
import {
  canBeginLayoutProduction,
  hasApprovedPayment,
  isPureAuthor,
} from "@/lib/payment/access";
import type { PaymentRequest } from "@/lib/store/types";

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

describe("canBeginLayoutProduction", () => {
  it("requires verified production status when payments are enabled", () => {
    expect(
      canBeginLayoutProduction(
        { status: "production", acceptancePaymentVerified: true, proofReady: false },
        true,
      ),
    ).toBe(true);

    expect(
      canBeginLayoutProduction(
        { status: "payment_pending", acceptancePaymentVerified: false, proofReady: false },
        true,
      ),
    ).toBe(false);

    expect(
      canBeginLayoutProduction(
        { status: "production", acceptancePaymentVerified: false, proofReady: false },
        true,
      ),
    ).toBe(false);
  });

  it("allows accepted manuscripts when payments are disabled", () => {
    expect(
      canBeginLayoutProduction(
        { status: "accepted", acceptancePaymentVerified: false, proofReady: false },
        false,
      ),
    ).toBe(true);
  });
});
