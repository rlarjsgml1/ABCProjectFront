// 관리자용 완료 결제 목록 조회 API 클라이언트 — controller 미구현으로 페이지에서 fallback과 함께 사용. 조회 전용.
import { apiClient } from './apiClient';
import type { AdminPaymentListQuery, AdminPaymentPage, ApiResponse } from '../types/api';

export async function getAdminPayments(query: AdminPaymentListQuery) {
  const response = await apiClient.get<ApiResponse<AdminPaymentPage>>('/admin/payments', {
    params: query,
  });

  return response.data.data;
}
