import { useMemo } from "react";
import { BarChart3, FileText, Users } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/useAuth";
import { useJournalStore } from "@/lib/store/store";
import { countByStatus, filterSubmissionsForReports } from "@/lib/store/submissionFilters";
import { ALL_STATUSES, getStatusLabel } from "@/lib/status/config";
import { routes } from "@/app/routes";

export default function ReportsPage() {
  const { user } = useAuth();
  const submissions = useJournalStore((s) => s.submissions);
  const users = useJournalStore((s) => s.users);

  const scopedSubmissions = useMemo(() => {
    if (!user) return [];
    return filterSubmissionsForReports(submissions, user.id, user.roles);
  }, [submissions, user]);

  const statusCounts = useMemo(() => countByStatus(scopedSubmissions), [scopedSubmissions]);

  const stats = [
    {
      label: "Total Submissions",
      value: scopedSubmissions.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Under Review",
      value: statusCounts.under_review ?? 0,
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Published",
      value: statusCounts.published ?? 0,
      icon: BarChart3,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Users",
      value: users.filter((u) => u.status === "active").length,
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <AuthenticatedLayout
      title="Reports & Statistics"
      breadcrumbs={[{ label: "Dashboard", href: routes.dashboard }, { label: "Reports" }]}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Submissions by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ALL_STATUSES.map((status) => (
                <TableRow key={status}>
                  <TableCell>{getStatusLabel(status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {statusCounts[status] ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
