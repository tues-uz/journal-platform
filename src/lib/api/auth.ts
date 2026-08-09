import { apiRequest } from "@/lib/api/client";
import type { TokenPair } from "@/lib/api/tokenStorage";
import type { AuthUser } from "@/features/auth/storage";
import type { Role } from "@/lib/rbac/types";
import { fromNumericUserId } from "@/lib/demo/ids";
import { isDemoMode } from "@/lib/demo/mode";

interface UserDto {
  id: number;
  name: string;
  email: string;
  roles: string[];
  status: string;
  institution?: string;
  avatarUrl?: string;
  lastLogin?: string;
}

interface TokenResponseDto extends TokenPair {
  user: UserDto;
}

function mapRole(role: string): Role {
  return role.toLowerCase() as Role;
}

function mapUserDto(dto: UserDto): AuthUser {
  const id = isDemoMode()
    ? fromNumericUserId(dto.id) ?? String(dto.id)
    : String(dto.id);

  return {
    id,
    name: dto.name,
    email: dto.email,
    roles: dto.roles.map(mapRole),
    avatarUrl: dto.avatarUrl,
    institution: dto.institution,
  };
}

function splitTokens(dto: TokenResponseDto): { tokens: TokenPair; user: AuthUser } {
  return {
    tokens: { accessToken: dto.accessToken, refreshToken: dto.refreshToken },
    user: mapUserDto(dto.user),
  };
}

export const authApi = {
  async login(email: string, password: string) {
    const data = await apiRequest<TokenResponseDto>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    return splitTokens(data);
  },

  async register(input: { name: string; email: string; password: string; institution?: string }) {
    const data = await apiRequest<TokenResponseDto>("/api/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    });
    return splitTokens(data);
  },

  async me() {
    const data = await apiRequest<UserDto>("/api/me");
    return mapUserDto(data);
  },
};
