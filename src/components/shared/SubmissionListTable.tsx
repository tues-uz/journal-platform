import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SubmissionPositionChip } from "@/components/shared/SubmissionPositionChip";
import { routes } from "@/app/routes";
import type { StoreUser, Submission } from "@/lib/store/types";

interface SubmissionListTableProps {
  submissions: Submission[];
  getUserById: (id: string) => StoreUser | undefined;
  actionLabel?: string | ((submission: Submission) => string);
  extraColumns?: Array<{
    header: string;
    cell: (submission: Submission) => ReactNode;
  }>;
  hideEditor?: boolean;
}

export function SubmissionListTable({
  submissions,
  getUserById,
  actionLabel = "View",
  extraColumns = [],
  hideEditor = false,
}: SubmissionListTableProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            {extraColumns.map((col) => (
              <TableHead key={col.header}>{col.header}</TableHead>
            ))}
            {!hideEditor && <TableHead>Position</TableHead>}
            {!hideEditor && <TableHead>Editor</TableHead>}
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => {
            const author = getUserById(sub.authorId);
            const editor = sub.handlingEditorId ? getUserById(sub.handlingEditorId) : undefined;
            const label = typeof actionLabel === "function" ? actionLabel(sub) : actionLabel;

            return (
              <TableRow key={sub.id}>
                <TableCell className="font-mono text-sm">{sub.submissionNumber}</TableCell>
                <TableCell className="max-w-xs truncate font-medium">{sub.title}</TableCell>
                <TableCell>{author?.name ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={sub.status} />
                </TableCell>
                {extraColumns.map((col) => (
                  <TableCell key={col.header}>{col.cell(sub)}</TableCell>
                ))}
                {!hideEditor && (
                  <TableCell>
                    <SubmissionPositionChip
                      submission={sub}
                      getUserById={getUserById}
                      showLabel={false}
                    />
                  </TableCell>
                )}
                {!hideEditor && <TableCell>{editor?.name ?? "—"}</TableCell>}
                <TableCell className="text-sm text-gray-500">
                  {new Date(sub.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild className="rounded-lg">
                    <Link to={routes.submissionById(sub.id)}>{label}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
