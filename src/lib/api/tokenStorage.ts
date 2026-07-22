export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_KEY = "journal-auth-tokens";

function read(): TokenPair | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenPair;
  } catch {
    return null;
  }
}

export const tokenStorage = {
  save(tokens: TokenPair) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },
  read,
  getAccessToken(): string | null {
    return read()?.accessToken ?? null;
  },
  getRefreshToken(): string | null {
    return read()?.refreshToken ?? null;
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
