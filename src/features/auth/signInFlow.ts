export async function prefetchThenNavigate(
  prefetch: (path: string) => Promise<void>,
  navigate: (path: string) => void,
  path: string
) {
  await runPostSignInRedirect(prefetch, navigate, path);
}

export function getRedirectFeedback(status: "idle" | "prefetching" | "navigating") {
  if (status === "prefetching") {
    return { label: "Preparing dashboard...", progress: 70 };
  }

  if (status === "navigating") {
    return { label: "Opening dashboard...", progress: 100 };
  }

  return { label: "Signing in...", progress: 15 };
}

export function getNextRedirectProgress(current: number, target: number) {
  if (current >= target) return target;
  return Math.min(target, current + 4);
}

export async function runPostSignInRedirect(
  prefetch: (path: string) => Promise<void>,
  navigate: (path: string) => void,
  path: string,
  onStatus?: (status: "prefetching" | "navigating") => void
) {
  onStatus?.("prefetching");
  await prefetch(path);
  onStatus?.("navigating");
  navigate(path);
}
