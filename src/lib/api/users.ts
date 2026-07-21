import { apiRequest } from "@/lib/api/client";
import type { Role } from "@/lib/rbac/types";

export interface UserCandidate {
  id: string;
  name: string;
}

interface UserSummaryDto {
  id: number;
  name: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  status: "active" | "inactive";
  institution?: string;
  avatarUrl?: string;
  lastLogin?: string;
}

interface UserDto {
  id: number;
  name: string;
  email: string;
  roles: string[];
  status: string;
  institution: string | null;
  avatarUrl: string | null;
  lastLogin: string | null;
}

function mapUserDto(dto: UserDto): ManagedUser {
  return {
    id: String(dto.id),
    name: dto.name,
    email: dto.email,
    roles: dto.roles.map((r) => r.toLowerCase() as Role),
    status: dto.status.toLowerCase() as "active" | "inactive",
    institution: dto.institution ?? undefined,
    avatarUrl: dto.avatarUrl ?? undefined,
    lastLogin: dto.lastLogin ?? undefined,
  };
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  roles: Role[];
  institution?: string;
}

export const usersApi = {
  async candidates(role: "HANDLING_EDITOR" | "REVIEWER"): Promise<UserCandidate[]> {
    const dtos = await apiRequest<UserSummaryDto[]>("/api/users/candidates", { params: { role } });
    return dtos.map((dto) => ({ id: String(dto.id), name: dto.name }));
  },

  async list(page = 0, size = 200): Promise<ManagedUser[]> {
    const dtos = await apiRequest<UserDto[]>("/api/users", { params: { page, size } });
    return dtos.map(mapUserDto);
  },

  async create(input: UserCreateInput): Promise<ManagedUser> {
    const dto = await apiRequest<UserDto>("/api/users", {
      method: "POST",
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        roles: input.roles.map((r) => r.toUpperCase()),
        institution: input.institution,
      },
    });
    return mapUserDto(dto);
  },

  async updateRoles(id: string, roles: Role[]): Promise<ManagedUser> {
    const dto = await apiRequest<UserDto>(`/api/users/${id}/roles`, {
      method: "PATCH",
      body: { roles: roles.map((r) => r.toUpperCase()) },
    });
    return mapUserDto(dto);
  },

  async updateStatus(id: string, status: "active" | "inactive"): Promise<ManagedUser> {
    const dto = await apiRequest<UserDto>(`/api/users/${id}/status`, {
      method: "PATCH",
      body: { status: status.toUpperCase() },
    });
    return mapUserDto(dto);
  },
};
