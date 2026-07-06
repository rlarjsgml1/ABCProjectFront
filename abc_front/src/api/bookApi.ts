import { apiClient } from './apiClient';
import type { ApiResponse, BookCard, PageResponse } from '../types/api';

export async function getBooks(page = 0, size = 20) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookCard>>>('/books', {
    params: { page, size },
  });

  return response.data.data;
}

export async function getBookDetail(bookId: number) {
  const response = await apiClient.get(`/books/${bookId}`);

  return response.data.data;
}
