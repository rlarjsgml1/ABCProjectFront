// 내가 최근 열람한 도서 목록 조회 API 클라이언트
import { apiClient } from './apiClient';
import type { ApiResponse, RecentBookItem, RecentBooksQuery } from '../types/api';

export async function getRecentBooks(params: RecentBooksQuery = {}) {
  const response = await apiClient.get<ApiResponse<RecentBookItem[]>>('/me/recent-books', {
    params,
  });

  return response.data.data;
}
