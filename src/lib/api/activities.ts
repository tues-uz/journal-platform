import { apiRequest } from "@/lib/api/client";
import type { Role } from "@/lib/rbac/types";
import type { SubmissionStatus } from "@/lib/store/types";

interface ActivityDto {
  id: number;
  submissionId: number;
  action: string;
  actorName: string;
  actorRoles: string[];
  statusAfter: string | null;
  timestamp: string;
  details: string | null;
}

export interface SubmissionActivity {
  id: string;
  title: string;
  actorName: string;
  actorRoles?: Role[];
  statusAfter?: SubmissionStatus;
  description?: string;
  timestamp: string;
}

function mapActivityDto(dto: ActivityDto): SubmissionActivity {
  return {
    id: String(dto.id),
    title: dto.action,
    actorName: dto.actorName,
    actorRoles: dto.actorRoles.map((role) => role.toLowerCase() as Role),
    statusAfter: dto.statusAfter ? (dto.statusAfter.toLowerCase() as SubmissionStatus) : undefined,
    description: dto.details ?? undefined,
    timestamp: dto.timestamp,
  };
}

export const activitiesApi = {
  async list(submissionId: string): Promise<SubmissionActivity[]> {
    const dtos = await apiRequest<ActivityDto[]>(`/api/submissions/${submissionId}/activities`);
    return dtos
      .map(mapActivityDto)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
};
