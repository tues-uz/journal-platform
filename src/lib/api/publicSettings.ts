import { apiRequest } from "@/lib/api/client";

interface PublicJournalSettingsDto {
  journalName: string;
  shortName: string;
}

export const publicSettingsApi = {
  async get(): Promise<{ journalName: string; shortName: string }> {
    return apiRequest<PublicJournalSettingsDto>("/api/public/settings", { auth: false });
  },
};
