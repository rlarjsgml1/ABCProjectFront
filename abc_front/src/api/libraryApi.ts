// 도서 보유 도서관 위치 조회 API 클라이언트 (U024)
import { apiClient } from './apiClient';
import type { ApiResponse, LibrarySummaryItem } from '../types/api';

export async function getBookLibraries(bookId: number) {
  const response = await apiClient.get<ApiResponse<LibrarySummaryItem[]>>(`/books/${bookId}/libraries`);

  const data = response.data.data;
  if (!Array.isArray(data)) {
    throw new Error('Invalid libraries response');
  }

  return data;
}
