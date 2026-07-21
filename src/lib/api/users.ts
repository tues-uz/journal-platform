import { apiRequest } from "@/lib/api/client";

export interface UserCandidate {
  id: string;
  name: string;
}

interface UserSummaryDto {
  id: number;
  name: string;
}

export const usersApi = {
  async candidates(role: "HANDLING_EDITOR" | "REVIEWER"): Promise<UserCandidate[]> {
    const dtos = await apiRequest<UserSummaryDto[]>("/api/users/candidates", { params: { role } });
    return dtos.map((dto) => ({ id: String(dto.id), name: dto.name }));
  },
};
