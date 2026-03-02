import { useMemo, useState } from "react";
import { SidebarContext, type SidebarContextValue } from "@/features/layout/sidebar-context";

const KEY = "journalSidebarCollapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem(KEY) === "true");

  const value = useMemo<SidebarContextValue>(() => {
    return {
      isCollapsed,
      setCollapsed: (next) => {
        setIsCollapsed(next);
        localStorage.setItem(KEY, String(next));
      },
      toggleCollapsed: () => {
        setIsCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem(KEY, String(next));
          return next;
        });
      },
    };
  }, [isCollapsed]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
