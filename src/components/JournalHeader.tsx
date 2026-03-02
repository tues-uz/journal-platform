import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, BookOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { routes } from "@/app/routes";
import { prefetchRoute } from "@/app/prefetch";

const JournalHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Home", path: routes.home },
    { name: "Articles", path: routes.articles },
    { name: "Authors", path: routes.authors },
    { name: "Topics", path: routes.topics },
    { name: "About", path: routes.about },
  ];

  const isActive = (path: string) => {
    if (path === routes.home) {
      return location.pathname === routes.home;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={routes.home} className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-gray-900" />
            <span className="text-lg font-bold text-gray-900">TUES Journal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="h-5 w-5 text-gray-600" />
            </button>

            {/* Login Button */}
            <Link to={routes.signin} onMouseEnter={() => void prefetchRoute(routes.signin)}>
              <Button 
                variant="ghost" 
                className="hidden md:flex text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full px-4 py-2 text-sm font-medium"
              >
                Sign In
              </Button>
            </Link>

            {/* Register Button */}
            <Link to={routes.register} onMouseEnter={() => void prefetchRoute(routes.signin)}>
              <Button className="hidden md:flex bg-gray-900 text-white hover:bg-gray-800 rounded-full px-4 py-2 text-sm font-medium">
                Get Started
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to={routes.signin}
                  onMouseEnter={() => void prefetchRoute(routes.signin)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  to={routes.register}
                  onMouseEnter={() => void prefetchRoute(routes.signin)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default JournalHeader;
