import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BreadcrumbNav, type BreadcrumbItemDef } from "@/components/layout/BreadcrumbNav";
import { useSidebarLayout } from "@/features/layout/useSidebarLayout";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItemDef[];
  toolbar?: ReactNode;
}

export function AuthenticatedLayout({
  children,
  title,
  breadcrumbs,
  toolbar,
}: AuthenticatedLayoutProps) {
  const { isCollapsed } = useSidebarLayout();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <div
        className={`transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-56"}`}
      >
        <AppTopbar title={title} />
        <main className="p-6">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-4">
              <BreadcrumbNav items={breadcrumbs} />
            </div>
          )}
          {(title || toolbar) && (
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              {title && (
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              )}
              {toolbar}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
