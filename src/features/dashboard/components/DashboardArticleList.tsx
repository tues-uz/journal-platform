import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  FileText,
  MoreVertical,
  RefreshCw,
  Send,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { routes } from "@/app/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Article, SortColumn } from "@/features/dashboard/types";
import {
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "@/features/dashboard/utils/articlePresentation";

export function DashboardArticleList({
  userRole,
  filteredArticles,
  sortedArticles,
  sortColumn,
  sortDirection,
  onSort,
}: {
  userRole: "journal_maker" | "journal_kurator";
  filteredArticles: Article[];
  sortedArticles: Article[];
  sortColumn: SortColumn;
  sortDirection: "asc" | "desc";
  onSort: (column: Exclude<SortColumn, null>) => void;
}) {
  if (filteredArticles.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-lg font-medium text-gray-900 mb-1">No articles found</p>
        <p className="text-sm text-gray-600">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  if (userRole === "journal_kurator") {
    return (
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <SortHeader label="Proposal" active={sortColumn === "proposal"} sortDirection={sortDirection} onClick={() => onSort("proposal")} />
                <SortHeader label="Article" active={sortColumn === "title"} sortDirection={sortDirection} onClick={() => onSort("title")} />
                <SortHeader label="Author" active={sortColumn === "author"} sortDirection={sortDirection} onClick={() => onSort("author")} />
                <SortHeader label="Category" active={sortColumn === "category"} sortDirection={sortDirection} onClick={() => onSort("category")} />
                <SortHeader label="Submitted" active={sortColumn === "submitted"} sortDirection={sortDirection} onClick={() => onSort("submitted")} />
                <SortHeader label="Status" active={sortColumn === "status"} sortDirection={sortDirection} onClick={() => onSort("status")} />
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {sortedArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-700">
                      {article.proposalNumber || `ts-${String(article.id).padStart(3, "0")}`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{article.title}</h3>
                      {article.comments && (
                        <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-800">
                          <span className="font-medium">Note:</span> {article.comments.substring(0, 60)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-sm text-gray-900">{article.author}</span>
                    </div>
                    {article.reviewer && (
                      <div className="mt-1 text-xs text-blue-600">Reviewer: {article.reviewer}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{article.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {article.submittedDate ? formatDate(article.submittedDate) : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusColor(article.status)} font-medium text-xs px-2 py-0.5`}>
                      {getStatusLabel(article.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {article.status === "submitted" && (
                            <>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Review
                              </DropdownMenuItem>
                              <DropdownMenuItem>Assign Reviewer</DropdownMenuItem>
                            </>
                          )}
                          {article.status === "under_review" && (
                            <>
                              <DropdownMenuItem>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accept
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Request Revision
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {(article.status === "accepted" ||
                            article.status === "revision_required" ||
                            article.status === "rejected") && (
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredArticles.map((article) => (
        <div
          key={article.id}
          className="group bg-white rounded-lg p-5 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-0 mb-4 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors leading-tight">
                  {article.title}
                </h3>
                <Badge
                  className={`${getStatusColor(article.status)} font-medium text-xs px-2 py-0.5 flex-shrink-0 ml-2`}
                >
                  {getStatusLabel(article.status)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  {article.category}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  {article.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {article.readTime} min
                </span>
                {article.submittedDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {formatDate(article.submittedDate)}
                  </span>
                )}
                {article.reviewer && (
                  <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                    <Users className="h-3 w-3" />
                    {article.reviewer}
                  </span>
                )}
              </div>

              {article.comments && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-amber-900 mb-2">Reviewer Comments</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{article.comments}</p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {article.status === "draft" && (
                    <>
                      <Link to={routes.editorById(article.id)}>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem>
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {article.status === "revision_required" && (
                    <>
                      <Link to={routes.editorById(article.id)}>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Revise
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                    </>
                  )}
                  {(article.status === "accepted" ||
                    article.status === "under_review" ||
                    article.status === "rejected") && (
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SortHeader({
  label,
  active,
  sortDirection,
  onClick,
}: {
  label: string;
  active: boolean;
  sortDirection: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th
      className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {label}
        {active ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </div>
    </th>
  );
}
