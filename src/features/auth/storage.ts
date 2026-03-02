export type JournalRole = "journal_maker" | "journal_kurator";

export interface AuthUser {
  name: string;
  email: string;
  role: JournalRole;
}

const NAME_KEY = "userName";
const EMAIL_KEY = "userEmail";

export function deriveRole(email: string): JournalRole {
  const normalized = email.toLowerCase();
  if (
    normalized.includes("kurator") ||
    normalized.includes("editor") ||
    normalized.includes("reviewer")
  ) {
    return "journal_kurator";
  }

  return "journal_maker";
}

export const authStorage = {
  save(name: string, email: string) {
    localStorage.setItem(NAME_KEY, name);
    localStorage.setItem(EMAIL_KEY, email);
  },
  clear() {
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(EMAIL_KEY);
  },
  read(): AuthUser | null {
    const name = localStorage.getItem(NAME_KEY);
    const email = localStorage.getItem(EMAIL_KEY);

    if (!name || !email) return null;

    return {
      name,
      email,
      role: deriveRole(email),
    };
  },
};
