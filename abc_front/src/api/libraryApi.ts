// 도서 보유 도서관 위치 조회 API 클라이언트 (U024) — 정보나루 종이책 소장 도서관 검색
import { apiClient } from './apiClient';
import type { ApiResponse, LibrarySearchQuery, LibrarySearchResponse } from '../types/api';

export async function getBookLibraries(bookId: number, query: LibrarySearchQuery) {
  const response = await apiClient.get<ApiResponse<LibrarySearchResponse>>(`/books/${bookId}/libraries`, {
    params: query,
  });

  return response.data.data;
}
