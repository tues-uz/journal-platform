import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Plus,
  AlertCircle,
  TrendingUp,
  Users,
  FileCheck,
  Calendar,
  Bell,
  BarChart3,
  MoreVertical,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import JournalDashboardSidebar from "@/components/JournalDashboardSidebar";

type UserRole = "journal_maker" | "journal_kurator";

type ArticleStatus = "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "revision_required";

interface Article {
  id: number;
  proposalNumber?: string;
  title: string;
  category: string;
  status: ArticleStatus;
  submittedDate: string;
  lastUpdated: string;
  author: string;
  reviewer?: string;
  comments?: string;
  readTime: number;
}

const JournalDashboard = () => {
  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";
  
  // Determine user role based on email (for demo purposes)
  const getUserRole = (): UserRole => {
    if (userEmail.includes("kurator") || userEmail.includes("editor") || userEmail.includes("reviewer")) {
      return "journal_kurator";
    }
    return "journal_maker";
  };

  const [userRole, setUserRole] = useState<UserRole>(getUserRole());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [articles, setArticles] = useState<Article[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Mock data for Journal Maker
  const makerArticles: Article[] = [
    {
      id: 1,
      title: "Inflation, Expectations, and Everyday Markets in Central Asia",
      category: "Macroeconomics",
      status: "accepted",
      submittedDate: "2024-01-10",
      lastUpdated: "2024-01-15",
      author: userName,
      readTime: 14,
    },
    {
      id: 2,
      title: "Pricing power in small markets: lessons from Termez bazaars",
      category: "Microeconomics",
      status: "under_review",
      submittedDate: "2024-01-20",
      lastUpdated: "2024-01-22",
      author: userName,
      reviewer: "Dr. Alisher Toshmatov",
      readTime: 6,
    },
    {
      id: 3,
      title: "Service-sector reforms and the future of Uzbek cities",
      category: "Policy & Reform",
      status: "revision_required",
      submittedDate: "2024-01-05",
      lastUpdated: "2024-01-18",
      author: userName,
      reviewer: "Dr. Dilshod Karimov",
      comments: "Please revise methodology section and add more recent data sources.",
      readTime: 10,
    },
    {
      id: 4,
      title: "Digital transformation in Central Asian banking systems",
      category: "Financial Markets",
      status: "draft",
      submittedDate: "",
      lastUpdated: "2024-01-25",
      author: userName,
      readTime: 12,
    },
    {
      id: 5,
      title: "Behavioral nudges in public transport pricing",
      category: "Behavioral Economics",
      status: "rejected",
      submittedDate: "2023-12-15",
      lastUpdated: "2024-01-10",
      author: userName,
      reviewer: "Dr. Malika Karimova",
      comments: "The research methodology needs significant improvement. Please resubmit with more robust data.",
      readTime: 7,
    },
  ];

  // Mock data for Journal Kurator
  const kuratorArticles: Article[] = [
    {
      id: 101,
      proposalNumber: "ts-001",
      title: "Climate change adaptation strategies for Central Asian economies",
      category: "Development Economics",
      status: "under_review",
      submittedDate: "2024-01-22",
      lastUpdated: "2024-01-24",
      author: "Dr. Feruza Nasirova",
      reviewer: userName,
      readTime: 16,
    },
    {
      id: 102,
      proposalNumber: "ts-002",
      title: "E-commerce growth and traditional retail transformation",
      category: "Microeconomics",
      status: "submitted",
      submittedDate: "2024-01-25",
      lastUpdated: "2024-01-25",
      author: "Student Economics Society",
      readTime: 10,
    },
    {
      id: 103,
      proposalNumber: "ts-003",
      title: "Monetary policy transmission mechanisms in emerging markets",
      category: "Macroeconomics",
      status: "under_review",
      submittedDate: "2024-01-18",
      lastUpdated: "2024-01-23",
      author: "Dr. Shavkat Mirziyoyev",
      reviewer: userName,
      readTime: 14,
    },
    {
      id: 104,
      proposalNumber: "ts-004",
      title: "Gender gaps in labor market participation: evidence from Central Asia",
      category: "Public Policy",
      status: "revision_required",
      submittedDate: "2024-01-12",
      lastUpdated: "2024-01-20",
      author: "Dr. Feruza Nasirova",
      reviewer: userName,
      comments: "Please add more recent statistics and expand on policy recommendations.",
      readTime: 13,
    },
  ];

  useEffect(() => {
    // Load articles based on role
    if (userRole === "journal_kurator") {
      setArticles(kuratorArticles);
    } else {
      setArticles(makerArticles);
    }
  }, [userRole]);

  const getStatusColor = (status: ArticleStatus) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
      case "under_review":
        return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "revision_required":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
      case "submitted":
        return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100";
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
    }
  };

  const getStatusLabel = (status: ArticleStatus) => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      case "under_review":
        return "Under Review";
      case "revision_required":
        return "Revision Required";
      case "submitted":
        return "Submitted";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not submitted";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue: any;
    let bValue: any;
    
    switch (sortColumn) {
      case "proposal":
        aValue = a.proposalNumber || `ts-${String(a.id).padStart(3, '0')}`;
        bValue = b.proposalNumber || `ts-${String(b.id).padStart(3, '0')}`;
        break;
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "author":
        aValue = a.author.toLowerCase();
        bValue = b.author.toLowerCase();
        break;
      case "category":
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case "submitted":
        aValue = a.submittedDate ? new Date(a.submittedDate).getTime() : 0;
        bValue = b.submittedDate ? new Date(b.submittedDate).getTime() : 0;
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Stats for Journal Maker
  const makerStats = [
    { label: "Total Journals", value: articles.length, icon: FileText, color: "text-blue-500", bgColor: "bg-blue-50" },
    { label: "Accepted", value: articles.filter(a => a.status === "accepted").length, icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-50" },
    { label: "Under Review", value: articles.filter(a => a.status === "under_review").length, icon: Clock, color: "text-yellow-500", bgColor: "bg-yellow-50" },
    { label: "Drafts", value: articles.filter(a => a.status === "draft").length, icon: Edit, color: "text-gray-500", bgColor: "bg-gray-50" },
  ];

  // Stats for Journal Kurator
  const kuratorStats = [
    { label: "Pending Review", value: articles.filter(a => a.status === "submitted" || a.status === "under_review").length, icon: FileCheck, color: "text-blue-500", bgColor: "bg-blue-50" },
    { label: "Accepted", value: articles.filter(a => a.status === "accepted").length, icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-50" },
    { label: "Revision Required", value: articles.filter(a => a.status === "revision_required").length, icon: AlertCircle, color: "text-yellow-500", bgColor: "bg-yellow-50" },
    { label: "Rejected", value: articles.filter(a => a.status === "rejected").length, icon: XCircle, color: "text-red-500", bgColor: "bg-red-50" },
  ];

  const stats = userRole === "journal_kurator" ? kuratorStats : makerStats;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("journalSidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    const checkSidebarState = () => {
      const saved = localStorage.getItem("journalSidebarCollapsed");
      setIsSidebarCollapsed(saved === "true");
    };

    checkSidebarState();
    const interval = setInterval(checkSidebarState, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <JournalDashboardSidebar />
      
      <main className={`pt-6 pb-20 transition-all duration-300 ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-56"}`}>
        <div className="container mx-auto px-6">
          {/* Dashboard Header */}
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
                <Link to="/journal/dashboard/editor/new">
                  <Button className="bg-gray-900 text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    New Journal
                  </Button>
                </Link>
              )}
            </div>

            {/* Stats Grid */}
            {userRole === "journal_kurator" ? (
              // Kurator Dashboard - Compact Dashboard Style
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-4"
                      >
                        <div className={`${stat.bgColor} p-3 rounded-lg flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Journal Maker Dashboard - Card Grid Layout
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 transition-all duration-200 overflow-hidden group"
                    >
                      {/* Decorative background element */}
                      <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bgColor} rounded-full -mr-10 -mt-10 opacity-20 group-hover:opacity-30 transition-opacity`} />
                      
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`${stat.bgColor} p-2.5 rounded-xl shadow-sm`}>
                            <Icon className={`h-5 w-5 ${stat.color}`} />
                          </div>
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                          <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search and Filter */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search Journals by title, category, or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="revision_required">Revision Required</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {userRole === "journal_kurator" ? "Journals for Review" : "My Journals"}
                </h2>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredArticles.length} {filteredArticles.length === 1 ? 'Journal' : 'Journals'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {userRole === "journal_kurator" 
                  ? "Review and manage Journal submissions" 
                  : "Track the status of your submissions and manage your work"}
              </p>
            </div>
            
            <div>
              {filteredArticles.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-1">No articles found</p>
                  <p className="text-sm text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              ) : userRole === "journal_kurator" ? (
                // Kurator Dashboard - Table-like Layout
                <div className="bg-white rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900 border-b border-gray-700">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort("proposal")}
                          >
                            <div className="flex items-center gap-2">
                              Proposal
                              {sortColumn === "proposal" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort("title")}
                          >
                            <div className="flex items-center gap-2">
                              Article
                              {sortColumn === "title" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort("author")}
                          >
                            <div className="flex items-center gap-2">
                              Author
                              {sortColumn === "author" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort("category")}
                          >
                            <div className="flex items-center gap-2">
                              Category
                              {sortColumn === "category" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort("submitted")}
                          >
                            <div className="flex items-center gap-2">
                              Submitted
                              {sortColumn === "submitted" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort("status")}
                          >
                            <div className="flex items-center gap-2">
                              Status
                              {sortColumn === "status" ? (
                                sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedArticles.map((article) => (
                          <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-mono text-gray-700">
                                {article.proposalNumber || `ts-${String(article.id).padStart(3, '0')}`}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-md">
                                <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                                  {article.title}
                                </h3>
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
                                <div className="mt-1 text-xs text-blue-600">
                                  Reviewer: {article.reviewer}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{article.category}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {article.submittedDate ? formatDate(article.submittedDate) : "—"}
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
                                        <DropdownMenuItem>
                                          Assign Reviewer
                                        </DropdownMenuItem>
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
                                    {(article.status === "accepted" || article.status === "revision_required" || article.status === "rejected") && (
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
              ) : (
                // Journal Maker Dashboard - Card Layout
                <div className="space-y-3">
                  {filteredArticles.map((article) => (
                    <div 
                      key={article.id} 
                      className="group bg-white rounded-lg p-5 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between gap-8">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-0 mb-4 flex-wrap">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors leading-tight">
                              {article.title}
                            </h3>
                            <Badge className={`${getStatusColor(article.status)} font-medium text-xs px-2 py-0.5 flex-shrink-0 ml-2`}>
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
                        
                        {/* Action Menu */}
                        <div className="flex-shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {userRole === "journal_maker" ? (
                                <>
                                  {article.status === "draft" && (
                                    <>
                                      <Link to={`/journal/dashboard/editor/${article.id}`}>
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
                                      <Link to={`/journal/dashboard/editor/${article.id}`}>
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
                                  {(article.status === "accepted" || article.status === "under_review" || article.status === "rejected") && (
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                  )}
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JournalDashboard;
