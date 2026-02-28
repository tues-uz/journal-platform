import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Settings,
  LogOut,
  BookOpen,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const JournalDashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("journalSidebarCollapsed");
    return saved === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";

  // Determine user role
  const isKurator = userEmail.includes("kurator") || userEmail.includes("editor") || userEmail.includes("reviewer");

  useEffect(() => {
    const saved = localStorage.getItem("journalSidebarCollapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("journalSidebarCollapsed", String(newState));
  };

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/journal/signin");
  };

  // Journal Maker Menu Items
  const makerMenuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/journal/dashboard",
    },
    {
      icon: FileText,
      label: "My Articles",
      path: "/journal/dashboard/articles",
    },
    {
      icon: Send,
      label: "Submissions",
      path: "/journal/dashboard/submissions",
    },
    {
      icon: Edit,
      label: "Drafts",
      path: "/journal/dashboard/drafts",
    },
    {
      icon: CheckCircle2,
      label: "Accepted",
      path: "/journal/dashboard/accepted",
    },
    {
      icon: Clock,
      label: "Under Review",
      path: "/journal/dashboard/review",
    },
  ];

  // Journal Kurator Menu Items
  const kuratorMenuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/journal/dashboard",
    },
    {
      icon: FileText,
      label: "Pending Review",
      path: "/journal/dashboard/pending",
    },
    {
      icon: CheckCircle2,
      label: "Accepted",
      path: "/journal/dashboard/accepted",
    },
    {
      icon: XCircle,
      label: "Rejected",
      path: "/journal/dashboard/rejected",
    },
    {
      icon: Clock,
      label: "Under Review",
      path: "/journal/dashboard/review",
    },
    {
      icon: Users,
      label: "Authors",
      path: "/journal/dashboard/authors",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      path: "/journal/dashboard/analytics",
    },
  ];

  const menuItems = isKurator ? kuratorMenuItems : makerMenuItems;

  const isActive = (path: string) => {
    if (path === "/journal/dashboard") {
      return location.pathname === "/journal/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-56"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 relative">
            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <Link to="/journal/dashboard" className="flex items-center gap-2 flex-1">
                  <BookOpen className="h-6 w-6 text-gray-900" />
                  <span className="text-lg font-bold text-gray-900">TUES Journal</span>
                </Link>
              )}
              {isCollapsed && (
                <Link to="/journal/dashboard" className="flex items-center justify-center flex-1">
                  <BookOpen className="h-6 w-6 text-gray-900" />
                </Link>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex h-8 w-8 rounded-full bg-white hover:bg-gray-100 absolute top-4 -right-4 border border-black/32 z-10"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* User Info */}
          {!isCollapsed && (
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {isKurator ? "Journal Kurator" : "Journal Maker"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-white" : "text-gray-500"}`} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 space-y-2">
            <Link
              to="/journal/dashboard/settings"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === "/journal/dashboard/settings"
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings className={`h-5 w-5 flex-shrink-0 ${
                location.pathname === "/journal/dashboard/settings" ? "text-white" : "text-gray-500"
              }`} />
              {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5 mr-3" />
              {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default JournalDashboardSidebar;
