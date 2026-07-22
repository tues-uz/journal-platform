import { apiRequest } from "@/lib/api/client";
import { mapSubmissionDto, type SubmissionDto } from "@/lib/api/submissions";
import type { Submission } from "@/lib/store/types";

async function call(path: string, body?: unknown): Promise<Submission> {
  const dto = await apiRequest<SubmissionDto>(path, { method: "POST", body });
  return mapSubmissionDto(dto);
}

export type ScreeningDecision = "APPROVE" | "REQUEST_REVISION" | "DESK_REJECT";
export type DecisionSlug =
  | "MINOR_REVISION"
  | "MAJOR_REVISION"
  | "REJECT"
  | "ACCEPT"
  | "FURTHER_REVISION"
  | "REJECT_AFTER_REVISION";
export type RecommendationValue = "ACCEPT" | "MINOR_REVISION" | "MAJOR_REVISION" | "REJECT";
export type PlagiarismStatusValue = "PENDING" | "PASSED" | "FAILED";

export const workflowApi = {
  recordPlagiarism(id: string, status: PlagiarismStatusValue, similarityScore?: number, notes?: string) {
    return call(`/api/submissions/${id}/plagiarism`, { status, similarityScore, notes });
  },

  screen(id: string, decision: ScreeningDecision, reason?: string) {
    return call(`/api/submissions/${id}/screening`, { decision, reason });
  },

  assignEditor(id: string, editorId: string) {
    return call(`/api/submissions/${id}/assign-editor`, { editorId: Number(editorId) });
  },

  inviteReviewer(id: string, reviewerId: string) {
    return call(`/api/submissions/${id}/invite-reviewer`, { reviewerId: Number(reviewerId) });
  },

  respondToInvitation(id: string, accept: boolean) {
    return call(`/api/submissions/${id}/reviewer-invitation`, { accept });
  },

  submitReview(id: string, recommendation: RecommendationValue, comments?: string) {
    return call(`/api/submissions/${id}/review`, { recommendation, comments });
  },

  submitRecommendation(id: string, recommendation: RecommendationValue, notes?: string) {
    return call(`/api/submissions/${id}/recommendation`, { recommendation, notes });
  },

  decide(id: string, decision: DecisionSlug, reason?: string) {
    return call(`/api/submissions/${id}/decision`, { decision, reason });
  },

  startCopyediting(id: string) {
    return call(`/api/submissions/${id}/copyediting/start`);
  },

  sendToProduction(id: string, notes?: string) {
    return call(`/api/submissions/${id}/copyediting/send-to-production`, { notes });
  },

  startLayout(id: string) {
    return call(`/api/submissions/${id}/layout/start`);
  },

  sendForProof(id: string) {
    return call(`/api/submissions/${id}/layout/send-for-proof`);
  },

  respondToProof(id: string, approve: boolean, note?: string) {
    return call(`/api/submissions/${id}/proof`, { approve, note });
  },

  publish(id: string, doi?: string, volumeId?: string, issueId?: string) {
    return call(`/api/submissions/${id}/publish`, {
      doi,
      volumeId: volumeId ? Number(volumeId) : undefined,
      issueId: issueId ? Number(issueId) : undefined,
    });
  },

  async assignDoi(id: string, doi: string): Promise<Submission> {
    const dto = await apiRequest<SubmissionDto>(`/api/submissions/${id}/doi`, { method: "PATCH", body: { doi } });
    return mapSubmissionDto(dto);
  },
};
