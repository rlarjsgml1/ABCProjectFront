import { apiClient } from './apiClient';
import type { ApiResponse, RecentBookItem, RecentBooksQuery } from '../types/api';

export async function getRecentBooks(params: RecentBooksQuery = {}) {
  const response = await apiClient.get<ApiResponse<RecentBookItem[]>>('/me/recent-books', {
    params,
  });

  return response.data.data;
}
