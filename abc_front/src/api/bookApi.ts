// 도서 목록/추천/최신/베스트/카테고리/검색/상세 조회 API 클라이언트
import { apiClient } from './apiClient';
import type { ApiResponse, BookCard, BookRecommendationResponse, BookRecommendationType, Category, PageResponse } from '../types/api';
import type { BookDetail } from '../types/book';

export type BookListQuery = {
  sort?: string;
  categoryId?: number;
  parentCategoryId?: number;
  category?: string;
  rentalType?: string;
  status?: string;
  section?: string;
};

export type BookSearchQuery = BookListQuery & {
  q: string;
  searchType?: 'ALL' | 'TITLE' | 'AUTHOR' | 'PUBLISHER';
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

// 실제 응답은 배열이 아니라 { recommendationType, books } 객체다 (BookRecommendationResponse.java 기준).
// baseBookId를 안 보내면 백엔드가 항상 MAIN(일반) 추천으로 처리하므로, 홈/도서목록의 "추천" 섹션처럼
// 특정 도서 기준이 아닌 추천에 사용한다. 특정 도서 기준 추천은 getRelatedBooks를 사용한다.
export async function getRecommendedBooks(size = 5) {
  const response = await apiClient.get<ApiResponse<BookRecommendationResponse>>('/books/recommendations', {
    params: { limit: size },
  });

  const data = response.data.data;
  if (!data || !Array.isArray(data.books)) {
    throw new Error('Invalid recommended books response');
  }

  return data.books;
}

// 도서 상세(U008)의 "같은 작가/장르의 다른 책"과 추천 도서 목록(U025)에서 사용한다.
export async function getRelatedBooks(baseBookId: number, type: BookRecommendationType, limit = 6) {
  const response = await apiClient.get<ApiResponse<BookRecommendationResponse>>('/books/recommendations', {
    params: { baseBookId, type, limit },
  });

  const data = response.data.data;
  if (!data || !Array.isArray(data.books)) {
    throw new Error('Invalid related books response');
  }

  return data.books;
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

  const categories = data.map(normalizeCategory);
  if (categories.length === 1 && categories[0].parentCategoryId == null && categories[0].children?.length) {
    return categories[0].children;
  }

  return categories;
}

function normalizeCategory(category: Category): Category {
  return {
    ...category,
    name: category.name ?? category.categoryName ?? '',
    children: category.children?.map(normalizeCategory) ?? [],
  };
}

export async function searchBooks(page = 0, size = 20, query: BookSearchQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookCard>>>('/books/search', {
    params: { page, size, ...query },
  });

  const data = response.data.data;
  if (!data?.content) {
    throw new Error('Invalid search response');
  }

  return data;
}

export async function getBookDetail(bookId: number) {
  const response = await apiClient.get<ApiResponse<BookDetail>>(`/books/${bookId}`);

  const data = response.data.data;
  if (!data) {
    throw new Error('Invalid book detail response');
  }

  const categoryName = data.categoryName ?? data.categories?.[0]?.categoryName ?? data.categories?.[0]?.name;
  const rentalType = data.rentalType ?? data.rentalInfo?.rentalType;
  const rentalPrice = data.rentalPrice ?? data.rentalInfo?.rentalPrice;
  const defaultRentalDays = data.defaultRentalDays ?? data.rentalInfo?.defaultRentalDays;
  const pageCount = data.pageCount ?? data.totalPages;

  return {
    ...data,
    author: data.author ?? data.authors?.join(', '),
    publisher: data.publisher ?? data.publisherName,
    publishedAt: data.publishedAt ?? data.pubDate,
    categoryName,
    rentalType,
    rentalPrice,
    defaultRentalDays,
    rentalPeriodDays: data.rentalPeriodDays ?? defaultRentalDays,
    pageCount,
    fileFormat: data.fileFormat ?? (typeof pageCount === 'number' ? '전자책' : undefined),
    supportedDevice: data.supportedDevice ?? '웹 뷰어 지원 기기',
    language: data.language ?? '한국어',
    status: data.status ?? 'AVAILABLE',
  };
}
