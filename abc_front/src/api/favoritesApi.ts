// 내 관심도서 목록 조회 및 관심도서 등록/삭제 API 클라이언트
import { apiClient } from './apiClient';
import type { ApiResponse, FavoriteBooksPage, FavoriteBooksQuery } from '../types/api';

export async function getMyFavorites(params: FavoriteBooksQuery = {}) {
  const response = await apiClient.get<ApiResponse<FavoriteBooksPage>>('/me/favorites', {
    params,
  });

  return response.data.data;
}

export async function createMyFavorite(bookId: number) {
  const response = await apiClient.post<ApiResponse<{ bookId: number }>>('/me/favorites', {
    bookId,
  });

  return response.data.data;
}

export async function deleteMyFavorite(bookId: number) {
  const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/me/favorites/${bookId}`);

  return response.data.data;
}
