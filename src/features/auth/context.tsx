import { useEffect, useMemo, useState, useCallback } from "react";
import { AuthContext, type AuthContextValue } from "@/features/auth/auth-context";
import { authStorage, type AuthUser } from "@/features/auth/storage";
import { tokenStorage, type TokenPair } from "@/lib/api/tokenStorage";
import { authApi } from "@/lib/api/auth";
import { isDemoMode, isDemoToken } from "@/lib/demo/mode";
import { useQueryClient } from "@tanstack/react-query";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(() =>
    tokenStorage.getAccessToken() ? authStorage.read() : null,
  );

  const resetRoleScopedQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["submissions"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      authStorage.clear();
      setUser(null);
      return;
    }
    if (isDemoMode() || isDemoToken(token)) {
      const cached = authStorage.read();
      if (cached) {
        setUser(cached);
        return;
      }
    }
    try {
      const freshUser = await authApi.me();
      authStorage.save(freshUser);
      setUser(freshUser);
    } catch {
      tokenStorage.clear();
      authStorage.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: !!user,
      login: (tokens: TokenPair, authUser: AuthUser) => {
        tokenStorage.save(tokens);
        authStorage.save(authUser);
        setUser(authUser);
        resetRoleScopedQueries();
      },
      logout: () => {
        tokenStorage.clear();
        authStorage.clear();
        setUser(null);
        resetRoleScopedQueries();
      },
      refreshUser,
    };
  }, [user, refreshUser, resetRoleScopedQueries]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
