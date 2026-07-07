import { apiClient } from './apiClient';
import type { ApiResponse, BookCard, Category, PageResponse } from '../types/api';
import type { BookDetail } from '../types/book';

export async function getBooks(page = 0, size = 20) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookCard>>>('/books', {
    params: { page, size },
  });

  return response.data.data;
}

export async function getRecommendedBooks(size = 5) {
  const response = await apiClient.get<ApiResponse<BookCard[]>>('/books/recommendations', {
    params: { size },
  });

  return response.data.data;
}

export async function getLatestBooks(size = 5) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookCard>>>('/books', {
    params: { page: 0, size, sort: 'latest' },
  });

  return response.data.data.content;
}

export async function getBestBooks(size = 10) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookCard>>>('/books', {
    params: { page: 0, size, section: 'best', sort: 'popular' },
  });

  return response.data.data.content;
}

export async function getCategories() {
  const response = await apiClient.get<ApiResponse<Category[]>>('/categories');

  return response.data.data;
}

export async function getBookDetail(bookId: number) {
  const response = await apiClient.get<ApiResponse<BookDetail>>(`/books/${bookId}`);

  return response.data.data;
}
