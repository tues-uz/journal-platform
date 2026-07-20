import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { routes } from "@/app/routes";

const Journal = lazy(() => import("@/pages/Journal"));
const ArticlePage = lazy(() => import("@/pages/ArticlePage"));
const JournalPlaceholder = lazy(() => import("@/pages/JournalPlaceholder"));
const JournalSignIn = lazy(() => import("@/pages/JournalSignIn"));
const JournalRegister = lazy(() => import("@/pages/JournalRegister"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const SubmissionsPage = lazy(() => import("@/pages/SubmissionsPage"));
const SubmissionDetailPage = lazy(() => import("@/pages/SubmissionDetailPage"));
const SubmissionDecisionPage = lazy(() => import("@/pages/SubmissionDecisionPage"));
const SubmissionCreatePage = lazy(() => import("@/pages/SubmissionCreatePage"));
const SubmissionEditPage = lazy(() => import("@/pages/SubmissionEditPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const ReviewsPage = lazy(() => import("@/pages/ReviewsPage"));
const EditorialPage = lazy(() => import("@/pages/EditorialPage"));
const EditorialDecisionPage = lazy(() => import("@/pages/EditorialDecisionPage"));
const ReviewerAssignmentPage = lazy(() => import("@/pages/ReviewerAssignmentPage"));
const PlagiarismPage = lazy(() => import("@/pages/PlagiarismPage"));
const ProductionPage = lazy(() => import("@/pages/ProductionPage"));
const LayoutFilesPage = lazy(() => import("@/pages/LayoutFilesPage"));
const PublishedPage = lazy(() => import("@/pages/PublishedPage"));
const VolumesPage = lazy(() => import("@/pages/VolumesPage"));
const DoiManagementPage = lazy(() => import("@/pages/DoiManagementPage"));
const AdminPaymentsPage = lazy(() => import("@/pages/AdminPaymentsPage"));
const AuthorPaymentPage = lazy(() => import("@/pages/AuthorPaymentPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const JournalEditor = lazy(() => import("@/pages/JournalEditor"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PageFallback() {
  return <div className="min-h-screen bg-gray-50" />;
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.home} element={withSuspense(<Journal />)} />
      <Route path="/article/:id" element={withSuspense(<ArticlePage />)} />
      <Route path={routes.articles} element={withSuspense(<JournalPlaceholder />)} />
      <Route path={routes.authors} element={withSuspense(<JournalPlaceholder />)} />
      <Route path={routes.topics} element={withSuspense(<JournalPlaceholder />)} />
      <Route path={routes.about} element={withSuspense(<JournalPlaceholder />)} />

      <Route path={routes.signin} element={withSuspense(<JournalSignIn />)} />
      <Route path={routes.register} element={withSuspense(<JournalRegister />)} />

      <Route element={<ProtectedRoute />}>
        <Route path={routes.dashboard} element={withSuspense(<DashboardPage />)} />
        <Route path={routes.submissionCreate} element={withSuspense(<SubmissionCreatePage />)} />
        <Route path={`${routes.submissions}/:id/edit`} element={withSuspense(<SubmissionEditPage />)} />
        <Route
          path={`${routes.submissions}/:id/decision/:decision`}
          element={withSuspense(<SubmissionDecisionPage />)}
        />
        <Route path={`${routes.submissions}/:id`} element={withSuspense(<SubmissionDetailPage />)} />
        <Route path={routes.notifications} element={withSuspense(<NotificationsPage />)} />
        <Route path={routes.profile} element={withSuspense(<ProfilePage />)} />
        <Route path={`${routes.editor}/:id?`} element={withSuspense(<JournalEditor />)} />
      </Route>

      <Route element={<ProtectedRoute module="submission" />}>
        <Route path={routes.submissions} element={withSuspense(<SubmissionsPage />)} />
      </Route>

      <Route element={<ProtectedRoute module="peer_review" />}>
        <Route path={routes.reviews} element={withSuspense(<ReviewsPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="admin_screening" />}>
        <Route path={routes.editorial} element={withSuspense(<EditorialPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="plagiarism" />}>
        <Route path={routes.plagiarism} element={withSuspense(<PlagiarismPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="editorial_decision" />}>
        <Route path={routes.editorialDecision} element={withSuspense(<EditorialDecisionPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="reviewer_assignment" />}>
        <Route path={routes.reviewerAssignment} element={withSuspense(<ReviewerAssignmentPage />)} />
      </Route>
      <Route element={<ProtectedRoute modules={["copyediting", "layout_production"]} />}>
        <Route path={routes.production} element={withSuspense(<ProductionPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="layout_production" />}>
        <Route path={routes.layoutFiles} element={withSuspense(<LayoutFilesPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="publication" />}>
        <Route path={routes.published} element={withSuspense(<PublishedPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="volume_issue" />}>
        <Route path={routes.volumes} element={withSuspense(<VolumesPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="doi_management" />}>
        <Route path={routes.doiManagement} element={withSuspense(<DoiManagementPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="user_management" />}>
        <Route path={routes.users} element={withSuspense(<UsersPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="author_payment" />}>
        <Route path={routes.payment} element={withSuspense(<AuthorPaymentPage />)} />
        <Route path={routes.payments} element={withSuspense(<AdminPaymentsPage />)} />
      </Route>
      <Route element={<ProtectedRoute module="system_config" />}>
        <Route path={routes.settings} element={withSuspense(<SettingsPage />)} />
      </Route>

      <Route path="*" element={withSuspense(<NotFound />)} />
    </Routes>
  );
}
