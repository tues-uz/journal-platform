import { apiRequest } from "@/lib/api/client";
import type { Notification } from "@/lib/store/types";

interface NotificationDto {
  id: number;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

function mapNotificationDto(dto: NotificationDto): Notification {
  return {
    id: String(dto.id),
    title: dto.title,
    message: dto.message,
    read: dto.read,
    link: dto.link ?? undefined,
    createdAt: dto.createdAt,
  };
}

export const notificationsApi = {
  async list(page = 0, size = 20): Promise<Notification[]> {
    const dtos = await apiRequest<NotificationDto[]>("/api/notifications", { params: { page, size } });
    return dtos.map(mapNotificationDto);
  },

  async markRead(id: string): Promise<Notification> {
    const dto = await apiRequest<NotificationDto>(`/api/notifications/${id}/read`, { method: "PATCH" });
    return mapNotificationDto(dto);
  },

  async markAllRead(): Promise<void> {
    await apiRequest<null>("/api/notifications/read-all", { method: "POST" });
  },
};
