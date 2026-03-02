import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  FileCheck,
  FileText,
  Plus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/app/routes";
import { prefetchRoute, prefetchRoutesOnIdle } from "@/app/prefetch";
import JournalDashboardSidebar from "@/components/JournalDashboardSidebar";
import { useAuth } from "@/features/auth/useAuth";
import { DashboardArticleList } from "@/features/dashboard/components/DashboardArticleList";
import { DashboardFilters } from "@/features/dashboard/components/DashboardFilters";
import { DashboardStats } from "@/features/dashboard/components/DashboardStats";
import { useDashboardArticles } from "@/features/dashboard/hooks/useDashboardArticles";
import type { SortColumn, UserRole } from "@/features/dashboard/types";
import { useSidebarLayout } from "@/features/layout/useSidebarLayout";

const JournalDashboard = () => {
  const { user } = useAuth();
  const { isCollapsed: isSidebarCollapsed } = useSidebarLayout();
  const userName = user?.name ?? "User";
  const userRole: UserRole = user?.role ?? "journal_maker";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { articles, filteredArticles, sortedArticles, statusCounts } = useDashboardArticles({
    userRole,
    userName,
    searchQuery,
    statusFilter,
    sortColumn,
    sortDirection,
  });

  const handleSort = (column: Exclude<SortColumn, null>) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortColumn(column);
    setSortDirection("asc");
  };

  const makerStats = [
    {
      label: "Total Journals",
      value: articles.length,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "Accepted",
      value: statusCounts.accepted,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      label: "Under Review",
      value: statusCounts.under_review,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Drafts",
      value: statusCounts.draft,
      icon: Edit,
      color: "text-gray-500",
      bgColor: "bg-gray-50",
    },
  ];

  const kuratorStats = [
    {
      label: "Pending Review",
      value: statusCounts.submitted + statusCounts.under_review,
      icon: FileCheck,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "Accepted",
      value: statusCounts.accepted,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      label: "Revision Required",
      value: statusCounts.revision_required,
      icon: AlertCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Rejected",
      value: statusCounts.rejected,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
  ];

  const stats = userRole === "journal_kurator" ? kuratorStats : makerStats;

  useEffect(() => {
    void prefetchRoutesOnIdle([routes.editor], prefetchRoute);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <JournalDashboardSidebar />

      <main className={`pt-6 pb-20 transition-all duration-300 ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-56"}`}>
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {userRole === "journal_kurator" ? "Journal Curator Dashboard" : "Journal Maker Dashboard"}
                </h1>
                <p className="text-gray-600">
                  {userRole === "journal_kurator"
                    ? "Review and manage Journal submissions"
                    : "Manage your Journals and track their status"}
                </p>
              </div>

              {userRole === "journal_maker" && (
                <Link to={routes.editorById("new")} onMouseEnter={() => void prefetchRoute(routes.editor)}>
                  <Button className="bg-gray-900 text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    New Journal
                  </Button>
                </Link>
              )}
            </div>

            <DashboardStats userRole={userRole} stats={stats} />
            <DashboardFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {userRole === "journal_kurator" ? "Journals for Review" : "My Journals"}
                </h2>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredArticles.length} {filteredArticles.length === 1 ? "Journal" : "Journals"}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {userRole === "journal_kurator"
                  ? "Review and manage Journal submissions"
                  : "Track the status of your submissions and manage your work"}
              </p>
            </div>

            <DashboardArticleList
              userRole={userRole}
              filteredArticles={filteredArticles}
              sortedArticles={sortedArticles}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default JournalDashboard;
