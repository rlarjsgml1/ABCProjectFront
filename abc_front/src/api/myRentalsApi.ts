// 내 도서 대여 내역 조회 API 클라이언트
import { apiClient } from './apiClient';
import type { ApiResponse, MyRentalsPage, MyRentalsQuery } from '../types/api';

export async function getMyRentals(params: MyRentalsQuery = {}) {
  const response = await apiClient.get<ApiResponse<MyRentalsPage>>('/me/rentals', {
    params,
  });

  return response.data.data;
}
