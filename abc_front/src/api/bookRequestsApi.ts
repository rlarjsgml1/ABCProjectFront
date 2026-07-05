import { apiClient } from './apiClient';
import type {
  ApiResponse,
  BookRequestCreateRequest,
  BookRequestCreateResponse,
  BookRequestHistoryPage,
  BookRequestHistoryQuery,
} from '../types/api';

export async function createBookRequest(payload: BookRequestCreateRequest) {
  const response = await apiClient.post<ApiResponse<BookRequestCreateResponse>>('/book-requests', payload);
  return response.data.data;
}

export async function getMyBookRequests(params: BookRequestHistoryQuery = {}) {
  const response = await apiClient.get<ApiResponse<BookRequestHistoryPage>>('/me/book-requests', {
    params,
  });

  return response.data.data;
}
