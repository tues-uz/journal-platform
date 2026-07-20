import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LayoutStatusBadge } from "@/components/shared/LayoutStatusBadge";
import type { Submission, Volume } from "@/lib/store/types";
import { routes } from "@/app/routes";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getIssueLabel(submission: Submission, volumes: Volume[]) {
  if (!submission.volumeId || !submission.issueId) return "—";
  const volume = volumes.find((v) => v.id === submission.volumeId);
  const issue = volume?.issues.find((i) => i.id === submission.issueId);
  if (!volume || !issue) return "—";
  return `Vol. ${volume.number}, Issue ${issue.number}`;
}

interface LayoutAssignedArticlesTableProps {
  submissions: Submission[];
  journalShortName: string;
  volumes: Volume[];
}

export function LayoutAssignedArticlesTable({
  submissions,
  journalShortName,
  volumes,
}: LayoutAssignedArticlesTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submission ID</TableHead>
            <TableHead>Article Title</TableHead>
            <TableHead>Journal</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Assigned Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell className="font-medium">{sub.submissionNumber}</TableCell>
              <TableCell className="max-w-[220px] truncate">{sub.title}</TableCell>
              <TableCell>{journalShortName}</TableCell>
              <TableCell>{getIssueLabel(sub, volumes)}</TableCell>
              <TableCell>{formatDate(sub.layoutAssignedAt)}</TableCell>
              <TableCell>{formatDate(sub.layoutDueDate)}</TableCell>
              <TableCell>
                <LayoutStatusBadge submission={sub} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link to={routes.submissionById(sub.id)}>Open</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
