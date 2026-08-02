import { tokenStorage } from "@/lib/api/tokenStorage";
import type { ApiError as ApiErrorDetail, ApiResponse } from "@/lib/api/types";

const rawBase = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "";
const API_BASE_URL = rawBase ? rawBase.replace(/\/+$/, "") : "";

export class ApiClientError extends Error {
  status: number;
  code?: string;
  errors?: ApiErrorDetail[];

  constructor(status: number, message: string, code?: string, errors?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  params?: Record<string, string | number | undefined>;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const json = (await res.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
    if (!res.ok || !json.success || !json.data) return null;

    tokenStorage.save({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
    return json.data.accessToken;
  } catch {
    return null;
  }
}

function buildUrl(path: string, params?: RequestOptions["params"]) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}, _retrying = false): Promise<T> {
  const { method = "GET", body, auth = true, params } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStorage.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !_retrying) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return apiRequest<T>(path, options, true);
    }
    tokenStorage.clear();
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !json || !json.success) {
    const firstError = json?.errors?.[0];
    throw new ApiClientError(
      res.status,
      firstError?.message ?? res.statusText ?? "Request failed",
      firstError?.code,
      json?.errors,
    );
  }

  return json.data as T;
}
