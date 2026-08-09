import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import type { BreadcrumbItemDef } from "@/components/layout/BreadcrumbNav";
import { useSidebarLayout } from "@/features/layout/useSidebarLayout";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItemDef[];
  toolbar?: ReactNode;
}

export function AuthenticatedLayout({
  children,
  title,
  subtitle,
  breadcrumbs,
  toolbar,
}: AuthenticatedLayoutProps) {
  const { isCollapsed } = useSidebarLayout();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main
        className={`relative flex h-[calc(100dvh-3.5rem)] w-full flex-1 flex-col overflow-hidden bg-background pt-14 transition-all duration-300 lg:h-dvh lg:pt-0 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <AppTopbar breadcrumbs={breadcrumbs} />
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50/40">
          <div className="flex flex-1 flex-col py-6 md:py-8">
            {(title || subtitle || toolbar) && (
              <div className="mb-6 px-4 lg:px-8">
                <div className="mx-auto flex max-w-4xl flex-wrap items-end justify-between gap-4">
                  {(title || subtitle) && (
                    <div className="space-y-1">
                      {title && (
                        <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
                          {title}
                        </h1>
                      )}
                      {subtitle && (
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                      )}
                    </div>
                  )}
                  {toolbar}
                </div>
              </div>
            )}
            <div className="px-4 lg:px-8 [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
