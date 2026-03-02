import { createContext } from "react";
import type { AuthUser } from "@/features/auth/storage";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (name: string, email: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
