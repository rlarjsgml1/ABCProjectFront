import { apiClient } from './apiClient';
import type {
  AdminBookCreateRequest,
  AdminBookCreateResponse,
  AdminBookDetail,
  AdminBookListQuery,
  AdminBookStatusChangeRequest,
  AdminBookStatusChangeResponse,
  AdminBookSummary,
  AdminBookUpdateRequest,
  AdminBookUpdateResponse,
  ApiResponse,
  PageResponse,
} from '../types/api';

function toAdminBookPayload(payload: AdminBookCreateRequest) {
  const { description, tableOfContents, publisherReview, ...basePayload } = payload;

  return {
    ...basePayload,
    detail: {
      description,
      tableOfContents,
      publisherReview,
    },
  };
}

export async function getAdminBooks(query: AdminBookListQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminBookSummary>>>('/admin/books', {
    params: query,
  });

  return response.data.data;
}

export async function getAdminBook(bookId: number) {
  const response = await apiClient.get<ApiResponse<AdminBookDetail>>(`/admin/books/${bookId}`);

  return response.data.data;
}

export async function createAdminBook(payload: AdminBookCreateRequest) {
  const response = await apiClient.post<ApiResponse<AdminBookCreateResponse>>('/admin/books', toAdminBookPayload(payload));

  return response.data.data;
}

export async function updateAdminBook(bookId: number, payload: AdminBookUpdateRequest) {
  const response = await apiClient.put<ApiResponse<AdminBookUpdateResponse>>(
    `/admin/books/${bookId}`,
    toAdminBookPayload(payload),
  );

  return response.data.data;
}

export async function changeAdminBookStatus(bookId: number, payload: AdminBookStatusChangeRequest) {
  const response = await apiClient.patch<ApiResponse<AdminBookStatusChangeResponse>>(
    `/admin/books/${bookId}/status`,
    payload,
  );

  return response.data.data;
}
