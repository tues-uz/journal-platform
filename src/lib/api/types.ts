export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errors?: ApiError[];
  meta: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  trace_id?: string;
}

export interface ResponseMeta {
  request_id: string;
  timestamp: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginationLinks {
  next: string | null;
  prev: null;
  self: string;
}

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== null;
}

export function isApiError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: false; errors: ApiError[] } {
  return response.success === false;
}
