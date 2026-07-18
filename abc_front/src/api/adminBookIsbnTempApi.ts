import { apiClient } from './apiClient';
import type { ApiResponse, PageResponse } from '../types/api';

export type BookIsbnTempStatus = 'PENDING' | 'READY' | 'MERGED';

export type ExternalBookDuplicateCandidate = {
  bookId: number;
  title: string;
  isbn: string;
  status: string;
};

export type ExternalBookDuplicateInfo = {
  status: string;
  existingBookId?: number;
  candidates: ExternalBookDuplicateCandidate[];
};

export type ExternalBookLookupResponse = {
  isbn13: string;
  title?: string;
  author?: string;
  publisher?: string;
  coverImageUrl?: string;
  description?: string;
  pubDate?: string;
  aladinCategoryId?: string;
  aladinCategoryName?: string;
  providers: {
    infonaru: string;
    naver: string;
    aladin: string;
  };
  duplicate: ExternalBookDuplicateInfo;
  warnings: string[];
};

export type BookIsbnTempSummary = {
  tempId: number;
  isbn13: string;
  bookTitle?: string;
  publisher?: string;
  author?: string;
  coverImageUrl?: string;
  pubDate?: string;
  aladinCategoryId?: string;
  aladinCategoryName?: string;
  statusCd: number;
  createdAt: string;
  updatedAt: string;
};

export type BookIsbnTempFetchResponse = {
  tempId: number;
  isbn13: string;
  statusCd: number;
  aladinCategoryId?: string;
  aladinCategoryName?: string;
  duplicate: ExternalBookDuplicateInfo;
};

export type BookIsbnSeedRequest = {
  keyword: string;
  targetCount: number;
  pageSize: number;
  maxPages: number;
};

export type BookIsbnSeedResponse = {
  targetCount: number;
  collectedCount: number;
  pagesFetched: number;
  collectedIsbns: string[];
};

export type BookIsbnEnrichResponse = {
  attemptedCount: number;
  readyCount: number;
  failedIsbns: string[];
};

export type BookIsbnTempApproveRequest = {
  title: string;
  publisherName: string;
  authors: string[];
  categoryIds: number[];
  rentalType: 'FREE' | 'PAID';
  rentalPrice: number;
  status: 'AVAILABLE' | 'HIDDEN' | 'INACTIVE';
  detail: {
    description?: string;
    tableOfContents?: string;
    publisherReview?: string;
    detailContent?: string;
  };
};

export type BookIsbnTempApproveResponse = {
  bookId: number;
  tempId: number;
  status: string;
};

export type BookIsbnBulkApproveRequest = {
  tempIds: number[];
  limit: number;
  maxCandidates: number;
  rentalType: 'FREE' | 'PAID';
  rentalPrice: number;
  status: 'AVAILABLE' | 'HIDDEN' | 'INACTIVE';
};

export type BookIsbnBulkApproveResponse = {
  approvedCount: number;
  approvedBookIds: number[];
  failures: Array<{ isbn13: string; reason: string }>;
};

export async function lookupExternalBook(isbn13: string) {
  const response = await apiClient.get<ApiResponse<ExternalBookLookupResponse>>('/admin/books/external/lookup', {
    params: { isbn13 },
  });
  return response.data.data;
}

export async function fetchBookIsbnTemp(isbn13: string) {
  const response = await apiClient.post<ApiResponse<BookIsbnTempFetchResponse>>('/admin/book-isbn-temps/fetch', {
    isbn13,
  });
  return response.data.data;
}

export async function seedBookIsbnTemps(payload: BookIsbnSeedRequest) {
  const response = await apiClient.post<ApiResponse<BookIsbnSeedResponse>>('/admin/book-isbn-temps/seed', payload);
  return response.data.data;
}

export async function enrichBookIsbnTemps(limit: number) {
  const response = await apiClient.post<ApiResponse<BookIsbnEnrichResponse>>('/admin/book-isbn-temps/enrich', {
    limit,
  });
  return response.data.data;
}

export async function getBookIsbnTemps(status: BookIsbnTempStatus, page: number, size: number) {
  const response = await apiClient.get<ApiResponse<PageResponse<BookIsbnTempSummary>>>('/admin/book-isbn-temps', {
    params: { status, page, size },
  });
  return response.data.data;
}

export async function approveBookIsbnTemp(tempId: number, payload: BookIsbnTempApproveRequest) {
  const response = await apiClient.post<ApiResponse<BookIsbnTempApproveResponse>>(
    `/admin/book-isbn-temps/${tempId}/approve`,
    payload,
  );
  return response.data.data;
}

export async function bulkApproveBookIsbnTemps(payload: BookIsbnBulkApproveRequest) {
  const response = await apiClient.post<ApiResponse<BookIsbnBulkApproveResponse>>(
    '/admin/book-isbn-temps/bulk-approve',
    payload,
  );
  return response.data.data;
}
