import { describe, expect, it, vi } from "vitest";
import { createRoutePrefetcher, prefetchRoutesOnIdle } from "@/app/prefetch";

describe("createRoutePrefetcher", () => {
  it("prefetches a known route only once", async () => {
    const editorLoader = vi.fn(async () => undefined);
    const prefetch = createRoutePrefetcher({
      "/dashboard/editor": editorLoader,
    });

    await prefetch("/dashboard/editor");
    await prefetch("/dashboard/editor");

    expect(editorLoader).toHaveBeenCalledTimes(1);
  });

  it("ignores unknown routes", async () => {
    const prefetch = createRoutePrefetcher({});
    await expect(prefetch("/unknown")).resolves.toBeUndefined();
  });

  it("schedules route prefetch work on idle callback", async () => {
    const prefetch = vi.fn(async () => undefined);
    const scheduler = vi.fn((run: () => void) => run());

    await prefetchRoutesOnIdle(["/dashboard/editor", "/dashboard"], prefetch, scheduler);

    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(prefetch).toHaveBeenNthCalledWith(1, "/dashboard/editor");
    expect(prefetch).toHaveBeenNthCalledWith(2, "/dashboard");
  });
});
