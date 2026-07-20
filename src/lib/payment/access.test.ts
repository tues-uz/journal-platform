import { describe, expect, it } from "vitest";
import type { AuthUser } from "@/features/auth/storage";
import {
  canAuthorCreateSubmission,
  hasApprovedPayment,
  isPureAuthor,
} from "@/lib/payment/access";
import type { PaymentRequest, PaymentSettings } from "@/lib/store/types";

const baseSettings: PaymentSettings = {
  enabled: true,
  amount: 500000,
  currency: "IDR",
  bankName: "Bank Mandiri",
  accountName: "TUES Journal Press",
  accountNumber: "1234567890",
  updatedAt: "2026-07-01T09:00:00Z",
  updatedBy: "user-admin",
};

const authorUser: AuthUser = {
  id: "author-1",
  name: "Test Author",
  email: "author@test.com",
  roles: ["author"],
};

const staffAuthorUser: AuthUser = {
  id: "staff-1",
  name: "Staff Author",
  email: "staff@test.com",
  roles: ["author", "editorial_staff"],
};

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

describe("canAuthorCreateSubmission", () => {
  it("allows pure authors with approved payment", () => {
    expect(canAuthorCreateSubmission(authorUser, [approvedPayment], baseSettings)).toBe(true);
  });

  it("blocks pure authors without approved payment when enabled", () => {
    expect(canAuthorCreateSubmission(authorUser, [], baseSettings)).toBe(false);
  });

  it("allows pure authors when payment gate is disabled", () => {
    expect(
      canAuthorCreateSubmission(authorUser, [], { ...baseSettings, enabled: false }),
    ).toBe(true);
  });

  it("allows staff who also hold author role without payment", () => {
    expect(canAuthorCreateSubmission(staffAuthorUser, [], baseSettings)).toBe(true);
  });
});
