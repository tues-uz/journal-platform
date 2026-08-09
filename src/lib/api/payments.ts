import { apiRequest } from "@/lib/api/client";
import { isDemoMode } from "@/lib/demo/mode";
import { readFileAsDataUrl } from "@/lib/files/submissionFiles";
import type { PaymentStatus } from "@/lib/store/types";

interface PaymentDto {
  id: number;
  authorId: number;
  authorName: string;
  amount: number;
  currency: string;
  status: string;
  referenceNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedById: number | null;
  reviewedByName: string | null;
  rejectionReason: string | null;
}

export interface ManagedPayment {
  id: string;
  authorId: string;
  authorName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  referenceNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewedByName?: string;
  rejectionReason?: string;
}

function mapPaymentDto(dto: PaymentDto): ManagedPayment {
  return {
    id: String(dto.id),
    authorId: String(dto.authorId),
    authorName: dto.authorName,
    amount: dto.amount,
    currency: dto.currency,
    status: dto.status.toLowerCase() as PaymentStatus,
    referenceNote: dto.referenceNote ?? undefined,
    submittedAt: dto.submittedAt,
    reviewedAt: dto.reviewedAt ?? undefined,
    reviewedById: dto.reviewedById != null ? String(dto.reviewedById) : undefined,
    reviewedByName: dto.reviewedByName ?? undefined,
    rejectionReason: dto.rejectionReason ?? undefined,
  };
}

interface PaymentSettingsDto {
  enabled: boolean;
  amount: number;
  currency: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  transferInstructions: string | null;
  updatedAt: string | null;
  updatedById: number | null;
}

export interface ManagedPaymentSettings {
  enabled: boolean;
  amount: number;
  currency: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  transferInstructions?: string;
  updatedAt?: string;
}

function mapSettingsDto(dto: PaymentSettingsDto): ManagedPaymentSettings {
  return {
    enabled: dto.enabled,
    amount: dto.amount,
    currency: dto.currency,
    bankName: dto.bankName,
    accountName: dto.accountName,
    accountNumber: dto.accountNumber,
    transferInstructions: dto.transferInstructions ?? undefined,
    updatedAt: dto.updatedAt ?? undefined,
  };
}

const ALL_STATUSES: PaymentStatus[] = ["pending_review", "approved", "rejected"];

export const paymentsApi = {
  async listByStatus(status: PaymentStatus, page = 0, size = 100): Promise<ManagedPayment[]> {
    const dtos = await apiRequest<PaymentDto[]>("/api/payments", {
      params: { status: status.toUpperCase(), page, size },
    });
    return dtos.map(mapPaymentDto);
  },

  /** No single "all statuses" endpoint — fetch each status and merge. */
  async listAll(): Promise<ManagedPayment[]> {
    const results = await Promise.all(ALL_STATUSES.map((status) => paymentsApi.listByStatus(status)));
    return results.flat();
  },

  async getSettings(): Promise<ManagedPaymentSettings> {
    const dto = await apiRequest<PaymentSettingsDto>("/api/settings/payment");
    return mapSettingsDto(dto);
  },

  async updateSettings(input: {
    enabled: boolean;
    amount: number;
    currency: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    transferInstructions?: string;
  }): Promise<ManagedPaymentSettings> {
    const dto = await apiRequest<PaymentSettingsDto>("/api/settings/payment", {
      method: "PUT",
      body: input,
    });
    return mapSettingsDto(dto);
  },

  async review(id: string, approve: boolean, reason?: string): Promise<ManagedPayment> {
    const dto = await apiRequest<PaymentDto>(`/api/payments/${id}/review`, {
      method: "POST",
      body: { approve, reason },
    });
    return mapPaymentDto(dto);
  },

  async getProofDownloadUrl(id: string): Promise<string> {
    const res = await apiRequest<{ url: string }>(`/api/payments/${id}/proof/download`);
    return res.url;
  },

  /** Presign → direct PUT to R2 → complete. Same three-call shape as submission file uploads. */
  async submitProof(file: File, referenceNote?: string): Promise<ManagedPayment> {
    const presigned = await apiRequest<{ uploadUrl: string; key: string; expiresAt: string }>(
      "/api/payments/presign",
      { method: "POST", body: { filename: file.name, contentType: file.type || "application/octet-stream" } },
    );

    if (!isDemoMode()) {
      const putRes = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error(`Upload to storage failed (${putRes.status})`);
      }
    }

    const completeBody: Record<string, unknown> = {
      key: presigned.key,
      referenceNote,
      filename: file.name,
    };
    if (isDemoMode()) {
      completeBody.size = file.size;
      completeBody.dataUrl = await readFileAsDataUrl(file);
    }

    const dto = await apiRequest<PaymentDto>("/api/payments", {
      method: "POST",
      body: completeBody,
    });
    return mapPaymentDto(dto);
  },
};
