import { createContext } from "react";

export interface SidebarContextValue {
  isCollapsed: boolean;
  setCollapsed: (next: boolean) => void;
  toggleCollapsed: () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);
