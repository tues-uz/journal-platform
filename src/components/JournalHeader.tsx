import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { JournalLogo } from "@/components/JournalLogo";
import { routes } from "@/app/routes";
import { prefetchRoute } from "@/app/prefetch";
import { PUBLIC_HEADER_NAV, isPublicNavActive } from "@/lib/journal/publicNav";

const JournalHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="px-6">
        <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          <Link to={routes.home} className="flex items-center gap-2.5 shrink-0">
            <JournalLogo className="h-9 w-auto" />
            <span className="hidden leading-[1.05] sm:block">
              <span className="block font-serif text-sm font-bold tracking-wide text-black">
                Studies in Economics
              </span>
              <span className="block font-serif text-sm font-bold tracking-wide text-black">
                And Finance System
              </span>
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-5 overflow-x-auto">
            {PUBLIC_HEADER_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-xs font-semibold tracking-wide uppercase transition-colors whitespace-nowrap ${
                  isPublicNavActive(location.pathname, item.path)
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to={routes.search}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </Link>

            <Link to={routes.signin} onMouseEnter={() => void prefetchRoute(routes.signin)}>
              <Button
                variant="ghost"
                className="hidden md:flex text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-none px-4 py-2 text-sm font-medium"
              >
                Sign In
              </Button>
            </Link>

            <Link to={routes.register} onMouseEnter={() => void prefetchRoute(routes.register)}>
              <Button className="hidden md:flex bg-journal-teal px-4 py-2 text-sm font-medium text-white hover:bg-journal-teal-dark rounded-none">
                Get Started
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-gray-200 max-h-[70vh] overflow-y-auto">
            <nav className="flex flex-col gap-3">
              {PUBLIC_HEADER_NAV.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-xs font-semibold tracking-wide uppercase transition-colors ${
                    isPublicNavActive(location.pathname, item.path)
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
                  <Button className="w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-none">
                    Sign In
                  </Button>
                </Link>
                <Link
                  to={routes.register}
                  onMouseEnter={() => void prefetchRoute(routes.register)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-journal-teal text-white hover:bg-journal-teal-dark rounded-none">
                    Get Started
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
        </div>
      </div>
    </header>
  );
};

export default JournalHeader;
