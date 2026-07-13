// 도서 리뷰 목록 조회 및 리뷰 작성/수정/삭제 API 클라이언트
import { apiClient } from './apiClient';
import type {
  ApiResponse,
  ReviewCreateRequest,
  ReviewDeleteResult,
  ReviewItem,
  ReviewListQuery,
  ReviewListResponse,
  ReviewUpdateRequest,
} from '../types/api';

export async function getBookReviews(bookId: number, query: ReviewListQuery = {}) {
  const response = await apiClient.get<ApiResponse<ReviewListResponse>>(`/books/${bookId}/reviews`, {
    params: query,
  });

  return response.data.data;
}

export async function createReview(payload: ReviewCreateRequest) {
  const response = await apiClient.post<ApiResponse<ReviewItem>>('/reviews', payload);

  return response.data.data;
}

export async function updateReview(reviewId: number, payload: ReviewUpdateRequest) {
  const response = await apiClient.patch<ApiResponse<ReviewItem>>(`/reviews/${reviewId}`, payload);

  return response.data.data;
}

export async function deleteReview(reviewId: number) {
  const response = await apiClient.delete<ApiResponse<ReviewDeleteResult>>(`/reviews/${reviewId}`);

  return response.data.data;
}
