import { useMemo, useState } from "react";
import { AuthContext, type AuthContextValue } from "@/features/auth/auth-context";
import { authStorage, type AuthUser } from "@/features/auth/storage";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.read());

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: !!user,
      login: (name, email) => {
        authStorage.save(name, email);
        const nextUser = authStorage.read();
        setUser(nextUser);
      },
      logout: () => {
        authStorage.clear();
        setUser(null);
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
