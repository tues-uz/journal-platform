import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { routes } from "@/app/routes";

const Journal = lazy(() => import("@/pages/Journal"));
const JournalPlaceholder = lazy(() => import("@/pages/JournalPlaceholder"));
const JournalSignIn = lazy(() => import("@/pages/JournalSignIn"));
const JournalDashboard = lazy(() => import("@/pages/JournalDashboard"));
const JournalEditor = lazy(() => import("@/pages/JournalEditor"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PageFallback() {
  return <div className="min-h-screen bg-white" />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.home} element={<Suspense fallback={<PageFallback />}><Journal /></Suspense>} />
      <Route path={routes.articles} element={<Suspense fallback={<PageFallback />}><JournalPlaceholder /></Suspense>} />
      <Route path={routes.authors} element={<Suspense fallback={<PageFallback />}><JournalPlaceholder /></Suspense>} />
      <Route path={routes.topics} element={<Suspense fallback={<PageFallback />}><JournalPlaceholder /></Suspense>} />
      <Route path={routes.about} element={<Suspense fallback={<PageFallback />}><JournalPlaceholder /></Suspense>} />

      <Route path={routes.signin} element={<Suspense fallback={<PageFallback />}><JournalSignIn /></Suspense>} />
      <Route path={routes.register} element={<Suspense fallback={<PageFallback />}><JournalSignIn /></Suspense>} />

      <Route element={<ProtectedRoute />}>
        <Route path={routes.dashboard} element={<Suspense fallback={<PageFallback />}><JournalDashboard /></Suspense>} />
        <Route path={`${routes.editor}/:id?`} element={<Suspense fallback={<PageFallback />}><JournalEditor /></Suspense>} />
      </Route>

      <Route path="*" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
    </Routes>
  );
}
