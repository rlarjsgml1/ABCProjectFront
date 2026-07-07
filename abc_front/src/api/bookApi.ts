import { apiClient } from './apiClient';
import type { ApiResponse, BookCard, Category, PageResponse } from '../types/api';
import type { BookDetail } from '../types/book';

export type BookListQuery = {
  sort?: string;
  categoryId?: number;
  category?: string;
  rentalType?: string;
  status?: string;
  section?: string;
};

export async function getBooks(page = 0, size = 20, query: BookListQuery = {}) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookCard>>>('/books', {
    params: { page, size, ...query },
  });

  const data = response.data.data;
  if (!data?.content) {
    throw new Error('Invalid books response');
  }

  return data;
}

export async function getRecommendedBooks(size = 5) {
  const response = await apiClient.get<ApiResponse<BookCard[]>>('/books/recommendations', {
    params: { size },
  });

  const data = response.data.data;
  if (!Array.isArray(data)) {
    throw new Error('Invalid recommended books response');
  }

  return data;
}

export async function getLatestBooks(size = 5) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookCard>>>('/books', {
    params: { page: 0, size, sort: 'latest' },
  });

  const data = response.data.data;
  if (!data?.content) {
    throw new Error('Invalid latest books response');
  }

  return data.content;
}

export async function getBestBooks(size = 10) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookCard>>>('/books', {
    params: { page: 0, size, section: 'best', sort: 'popular' },
  });

  const data = response.data.data;
  if (!data?.content) {
    throw new Error('Invalid best books response');
  }

  return data.content;
}

export async function getCategories() {
  const response = await apiClient.get<ApiResponse<Category[]>>('/categories');

  const data = response.data.data;
  if (!Array.isArray(data)) {
    throw new Error('Invalid categories response');
  }

  return data;
}

export async function getBookDetail(bookId: number) {
  const response = await apiClient.get<ApiResponse<BookDetail>>(`/books/${bookId}`);

  return response.data.data;
}

export async function getBookDetail(bookId: number) {
  const response = await apiClient.get(`/books/${bookId}`);

  return response.data.data;
}
