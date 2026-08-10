/** Offline demo mode — local seed store instead of a remote API. */
export function isDemoMode(): boolean {
  if (import.meta.env.VITE_DEMO_MODE === "true") return true;
  return !import.meta.env.VITE_API_URL;
}

export function isDemoToken(token: string | null | undefined): boolean {
  return !!token?.startsWith("demo-access-");
}
