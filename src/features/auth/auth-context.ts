import { createContext } from "react";
import type { AuthUser } from "@/features/auth/storage";
import type { TokenPair } from "@/lib/api/tokenStorage";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (tokens: TokenPair, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
