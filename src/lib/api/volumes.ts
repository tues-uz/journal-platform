import { apiRequest } from "@/lib/api/client";

interface VolumeDto {
  id: number;
  number: number;
  year: number;
  title: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedVolume {
  id: string;
  number: number;
  year: number;
  title?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

function mapVolumeDto(dto: VolumeDto): ManagedVolume {
  return {
    id: String(dto.id),
    number: dto.number,
    year: dto.year,
    title: dto.title ?? undefined,
    status: dto.status.toLowerCase() as ManagedVolume["status"],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export interface VolumeCreateInput {
  number: number;
  year: number;
  title?: string;
}

export interface VolumeUpdateInput {
  number?: number;
  year?: number;
  title?: string;
  status?: "draft" | "published";
}

export const volumesApi = {
  async list(page = 0, size = 200): Promise<ManagedVolume[]> {
    const dtos = await apiRequest<VolumeDto[]>("/api/volumes", { params: { page, size } });
    return dtos.map(mapVolumeDto);
  },

  async create(input: VolumeCreateInput): Promise<ManagedVolume> {
    const dto = await apiRequest<VolumeDto>("/api/volumes", { method: "POST", body: input });
    return mapVolumeDto(dto);
  },

  async update(id: string, input: VolumeUpdateInput): Promise<ManagedVolume> {
    const dto = await apiRequest<VolumeDto>(`/api/volumes/${id}`, {
      method: "PATCH",
      body: { ...input, status: input.status?.toUpperCase() },
    });
    return mapVolumeDto(dto);
  },
};
