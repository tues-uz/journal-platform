import { routes } from "@/app/routes";

type Loader = () => Promise<unknown>;
type IdleScheduler = (run: () => void) => void;

export function createRoutePrefetcher(loaders: Record<string, Loader>) {
  const prefetched = new Set<string>();

  return async function prefetchRoute(path: string): Promise<void> {
    const normalized = path.split("?")[0];
    const loader = loaders[normalized];
    if (!loader || prefetched.has(normalized)) return;

    prefetched.add(normalized);
    try {
      await loader();
    } catch {
      prefetched.delete(normalized);
    }
  };
}

function defaultIdleScheduler(run: () => void) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const idleWindow = window as Window & {
      requestIdleCallback: (callback: () => void) => void;
    };
    idleWindow.requestIdleCallback(run);
    return;
  }

  setTimeout(run, 200);
}

export async function prefetchRoutesOnIdle(
  paths: string[],
  prefetch: (path: string) => Promise<void>,
  scheduler: IdleScheduler = defaultIdleScheduler
) {
  await new Promise<void>((resolve) => {
    scheduler(async () => {
      for (const path of paths) {
        await prefetch(path);
      }
      resolve();
    });
  });
}

const routeLoaders: Record<string, Loader> = {
  [routes.signin]: () => import("@/pages/JournalSignIn"),
  [routes.register]: () => import("@/pages/JournalRegister"),
  [routes.dashboard]: () => import("@/pages/JournalDashboard"),
  [routes.editor]: () => import("@/pages/JournalEditor"),
};

export const prefetchRoute = createRoutePrefetcher(routeLoaders);
