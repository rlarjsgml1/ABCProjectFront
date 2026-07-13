// 무료/유료 도서 대여 생성 API 클라이언트
import { apiClient } from './apiClient';
import type { ApiResponse, RentalPaymentRequest, RentalPaymentResult } from '../types/api';

export async function createFreeRental(bookId: number) {
  const response = await apiClient.post<ApiResponse<RentalPaymentResult>>('/rentals/free', {
    bookId,
  });

  return response.data.data;
}

export async function createPaidRental(request: RentalPaymentRequest) {
  const response = await apiClient.post<ApiResponse<RentalPaymentResult>>('/rentals/paid', request);

  return response.data.data;
}
