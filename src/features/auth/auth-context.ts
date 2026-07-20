import { createContext } from "react";
import type { AuthUser } from "@/features/auth/storage";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
