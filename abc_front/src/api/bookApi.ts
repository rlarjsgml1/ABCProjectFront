import { apiClient } from './apiClient';
import type { ApiResponse, BookCard, PageResponse } from '../types/api';

export async function getBooks(page = 0, size = 20) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookCard>>>('/books', {
    params: { page, size },
  });

  return response.data.data;
}
