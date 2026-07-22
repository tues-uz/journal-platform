import { apiRequest } from "@/lib/api/client";

interface IssueDto {
  id: number;
  volumeId: number;
  number: number;
  title: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedIssue {
  id: string;
  volumeId: string;
  number: number;
  title?: string;
  status: "draft" | "published";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function mapIssueDto(dto: IssueDto): ManagedIssue {
  return {
    id: String(dto.id),
    volumeId: String(dto.volumeId),
    number: dto.number,
    title: dto.title ?? undefined,
    status: dto.status.toLowerCase() as ManagedIssue["status"],
    publishedAt: dto.publishedAt ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export interface IssueCreateInput {
  volumeId: string;
  number: number;
  title?: string;
}

export interface IssueUpdateInput {
  number?: number;
  title?: string;
}

export const issuesApi = {
  async list(volumeId?: string, page = 0, size = 200): Promise<ManagedIssue[]> {
    const dtos = await apiRequest<IssueDto[]>("/api/issues", {
      params: { volumeId: volumeId ? Number(volumeId) : undefined, page, size },
    });
    return dtos.map(mapIssueDto);
  },

  async create(input: IssueCreateInput): Promise<ManagedIssue> {
    const dto = await apiRequest<IssueDto>("/api/issues", {
      method: "POST",
      body: { volumeId: Number(input.volumeId), number: input.number, title: input.title },
    });
    return mapIssueDto(dto);
  },

  async update(id: string, input: IssueUpdateInput): Promise<ManagedIssue> {
    const dto = await apiRequest<IssueDto>(`/api/issues/${id}`, { method: "PATCH", body: input });
    return mapIssueDto(dto);
  },

  async publish(id: string): Promise<ManagedIssue> {
    const dto = await apiRequest<IssueDto>(`/api/issues/${id}/publish`, { method: "POST" });
    return mapIssueDto(dto);
  },
};
