import { apiRequest } from "@/lib/api/client";

export interface JournalSettingsDto {
  journalName: string;
  shortName: string;
  publisher: string;
  issn: string;
  contactEmail: string;
  submissionGuidelines: string;
  reviewPolicy: string;
  defaultLanguage: string;
  updatedAt: string;
  updatedById: number | null;
}

export interface JournalSettingsUpdateRequest {
  journalName?: string;
  shortName?: string;
  publisher?: string;
  issn?: string;
  contactEmail?: string;
  submissionGuidelines?: string;
  reviewPolicy?: string;
  defaultLanguage?: string;
}

export const settingsApi = {
  async getJournalSettings(): Promise<JournalSettingsDto> {
    return apiRequest<JournalSettingsDto>("/api/settings/journal");
  },

  async updateJournalSettings(request: JournalSettingsUpdateRequest): Promise<JournalSettingsDto> {
    return apiRequest<JournalSettingsDto>("/api/settings/journal", {
      method: "PUT",
      body: request,
    });
  },
};
