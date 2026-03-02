import { describe, expect, it, vi } from "vitest";
import {
  getNextRedirectProgress,
  getRedirectFeedback,
  prefetchThenNavigate,
  runPostSignInRedirect,
} from "@/features/auth/signInFlow";

describe("prefetchThenNavigate", () => {
  it("prefetches dashboard before navigating", async () => {
    const calls: string[] = [];
    const prefetch = vi.fn(async () => {
      calls.push("prefetch");
    });
    const navigate = vi.fn(() => {
      calls.push("navigate");
    });

    await prefetchThenNavigate(prefetch, navigate, "/dashboard");

    expect(prefetch).toHaveBeenCalledWith("/dashboard");
    expect(navigate).toHaveBeenCalledWith("/dashboard");
    expect(calls).toEqual(["prefetch", "navigate"]);
  });

  it("emits redirect status through prefetch and navigate phases", async () => {
    const statuses: string[] = [];
    const prefetch = vi.fn(async () => undefined);
    const navigate = vi.fn(() => undefined);

    await runPostSignInRedirect(prefetch, navigate, "/dashboard", (status) => {
      statuses.push(status);
    });

    expect(statuses).toEqual(["prefetching", "navigating"]);
  });

  it("provides progress feedback labels and values", () => {
    expect(getRedirectFeedback("idle")).toEqual({ label: "Signing in...", progress: 15 });
    expect(getRedirectFeedback("prefetching")).toEqual({ label: "Preparing dashboard...", progress: 70 });
    expect(getRedirectFeedback("navigating")).toEqual({ label: "Opening dashboard...", progress: 100 });
  });

  it("eases progress toward target without overshooting", () => {
    expect(getNextRedirectProgress(70, 95)).toBe(74);
    expect(getNextRedirectProgress(94, 95)).toBe(95);
    expect(getNextRedirectProgress(95, 95)).toBe(95);
  });
});
