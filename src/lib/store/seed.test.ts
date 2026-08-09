import { describe, expect, it } from "vitest";
import { SEED_DATA, SEED_DEMO_AUTHORS, repairUnpaidProductionSubmissions, stripSeedDemoData } from "@/lib/store/seed";

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

describe("repairUnpaidProductionSubmissions", () => {
  it("moves unpaid production manuscripts back to payment_pending", () => {
    const repaired = repairUnpaidProductionSubmissions({
      ...SEED_DATA,
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
