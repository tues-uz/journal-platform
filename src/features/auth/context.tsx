import { useEffect, useMemo, useState, useCallback } from "react";
import { AuthContext, type AuthContextValue } from "@/features/auth/auth-context";
import { authStorage, type AuthUser } from "@/features/auth/storage";
import { tokenStorage, type TokenPair } from "@/lib/api/tokenStorage";
import { authApi } from "@/lib/api/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    tokenStorage.getAccessToken() ? authStorage.read() : null,
  );

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      authStorage.clear();
      setUser(null);
      return;
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
      },
      logout: () => {
        tokenStorage.clear();
        authStorage.clear();
        setUser(null);
      },
      refreshUser,
    };
  }, [user, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
