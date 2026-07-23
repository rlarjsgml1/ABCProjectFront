// 관리자용 대여 현황 조회 API 클라이언트. 조회 전용.
import { apiClient } from './apiClient';
import type { AdminRentalListQuery, AdminRentalPage, ApiResponse } from '../types/api';

export async function getAdminRentals(query: AdminRentalListQuery) {
  const response = await apiClient.get<ApiResponse<AdminRentalPage>>('/admin/rentals', {
    params: query,
  });

  return response.data.data;
}
