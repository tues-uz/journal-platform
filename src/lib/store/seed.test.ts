import { describe, expect, it } from "vitest";
import { SEED_DATA, SEED_DEMO_AUTHORS, repairApprovedPaymentSubmissions, repairUnpaidProductionSubmissions, stripSeedDemoData } from "@/lib/store/seed";

describe("stripSeedDemoData", () => {
  it("keeps demo author accounts after refresh migration", () => {
    const migrated = stripSeedDemoData(SEED_DATA);

    for (const seedAuthor of SEED_DEMO_AUTHORS) {
      const user = migrated.users.find((entry) => entry.email === seedAuthor.email);
      expect(user, seedAuthor.email).toBeDefined();
      expect(user?.password).toBe(seedAuthor.password);
    }
  });
});

describe("repairApprovedPaymentSubmissions", () => {
  it("moves payment_pending manuscripts to production when author payment is approved", () => {
    const repaired = repairApprovedPaymentSubmissions({
      ...SEED_DATA,
      paymentSettings: { ...SEED_DATA.paymentSettings, enabled: true },
      submissions: [
        {
          ...SEED_DATA.submissions[0]!,
          id: "sub-paid",
          submissionNumber: "SJMS-2026-100",
          authorId: "user-multi",
          status: "payment_pending",
          acceptancePaymentVerified: false,
        },
      ],
      payments: SEED_DATA.payments,
    });

    const submission = repaired.submissions.find((entry) => entry.id === "sub-paid");
    expect(submission?.status).toBe("production");
    expect(submission?.acceptancePaymentVerified).toBe(true);
  });
});

describe("repairUnpaidProductionSubmissions", () => {
  it("moves unpaid production manuscripts back to payment_pending", () => {
    const repaired = repairUnpaidProductionSubmissions({
      ...SEED_DATA,
      paymentSettings: { ...SEED_DATA.paymentSettings, enabled: true },
      submissions: [
        {
          ...SEED_DATA.submissions[0]!,
          id: "sub-unpaid",
          submissionNumber: "SJMS-2026-099",
          status: "production",
          acceptancePaymentVerified: false,
          layoutStartedAt: "2026-07-20T09:00:00Z",
        },
      ],
    });

    const submission = repaired.submissions.find((entry) => entry.id === "sub-unpaid");
    expect(submission?.status).toBe("payment_pending");
    expect(submission?.layoutStartedAt).toBeUndefined();
  });
});
