import { apiClient } from './apiClient';
import type {
  AdminBookListQuery,
  AdminBookStatusChangeRequest,
  AdminBookStatusChangeResponse,
  AdminBookSummary,
  ApiResponse,
  PageResponse,
} from '../types/api';

export async function getAdminBooks(query: AdminBookListQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminBookSummary>>>('/admin/books', {
    params: query,
  });

  return response.data.data;
}

export async function changeAdminBookStatus(bookId: number, payload: AdminBookStatusChangeRequest) {
  const response = await apiClient.patch<ApiResponse<AdminBookStatusChangeResponse>>(
    `/admin/books/${bookId}/status`,
    payload,
  );

  return response.data.data;
}
