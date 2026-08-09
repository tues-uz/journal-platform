/** Offline demo mode — active when no remote API URL is configured. */
export function isDemoMode(): boolean {
  return !import.meta.env.VITE_API_URL;
}

export function isDemoToken(token: string | null | undefined): boolean {
  return !!token?.startsWith("demo-access-");
}
