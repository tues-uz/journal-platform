import { useMemo, useState, useCallback } from "react";
import { AuthContext, type AuthContextValue } from "@/features/auth/auth-context";
import { authStorage, type AuthUser } from "@/features/auth/storage";
import { useJournalStore } from "@/lib/store/store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.read());
  const getUserById = useJournalStore((s) => s.getUserById);

  const refreshUser = useCallback(() => {
    const session = authStorage.read();
    if (!session) {
      setUser(null);
      return;
    }
    const storeUser = getUserById(session.id);
    if (storeUser && storeUser.status === "active") {
      const refreshed: AuthUser = {
        id: storeUser.id,
        name: storeUser.name,
        email: storeUser.email,
        roles: storeUser.roles,
        avatarUrl: storeUser.avatarUrl,
      };
      authStorage.save(refreshed);
      setUser(refreshed);
    } else {
      authStorage.clear();
      setUser(null);
    }
  }, [getUserById]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: !!user,
      login: (authUser) => {
        authStorage.save(authUser);
        setUser(authUser);
      },
      logout: () => {
        authStorage.clear();
        setUser(null);
      },
      refreshUser,
    };
  }, [user, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
