import { tokenStorage } from "@/lib/api/tokenStorage";
import { authStorage } from "@/features/auth/storage";
import { isDemoToken } from "@/lib/demo/mode";

export function getDemoUserIdFromToken(): string | null {
  const token = tokenStorage.getAccessToken();
  if (!isDemoToken(token)) return null;
  return token!.slice("demo-access-".length);
}

export function getDemoAuthUser() {
  return authStorage.read();
}
