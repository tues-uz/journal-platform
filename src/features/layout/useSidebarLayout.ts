import { useContext } from "react";
import { SidebarContext, type SidebarContextValue } from "@/features/layout/sidebar-context";

export function useSidebarLayout(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarLayout must be used inside <SidebarProvider>");
  }

  return context;
}
