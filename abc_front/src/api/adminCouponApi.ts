// 관리자 쿠폰 정의 조회, 등록, 회원 발급 API 클라이언트
import { apiClient } from './apiClient';
import type {
  AdminCouponCreateRequest,
  AdminCouponCreateResponse,
  AdminCouponIssueRequest,
  AdminCouponIssueResponse,
  AdminCouponListQuery,
  AdminCouponSummary,
  ApiResponse,
  PageResponse,
} from '../types/api';

export async function getAdminCoupons(query: AdminCouponListQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminCouponSummary>>>('/admin/coupons', {
    params: query,
  });

  return response.data.data;
}

export async function createAdminCoupon(payload: AdminCouponCreateRequest) {
  const response = await apiClient.post<ApiResponse<AdminCouponCreateResponse>>('/admin/coupons', payload);

  return response.data.data;
}

export async function issueAdminCoupon(couponId: number, payload: AdminCouponIssueRequest) {
  const response = await apiClient.post<ApiResponse<AdminCouponIssueResponse>>(`/admin/coupons/${couponId}/issue`, payload);

  return response.data.data;
}
