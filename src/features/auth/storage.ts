import type { Role } from "@/lib/rbac/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  avatarUrl?: string;
}

const SESSION_KEY = "journal-auth-session";

export const authStorage = {
  save(user: AuthUser) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
  read(): AuthUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
};
