import { apiClient } from './apiClient';
import type {
  ApiResponse,
  CouponHistoryPage,
  CouponHistoryQuery,
  PointHistoryQuery,
  PointSummary,
} from '../types/api';

export async function getMyPoints(params: PointHistoryQuery = {}) {
  const response = await apiClient.get<ApiResponse<PointSummary>>('/me/points', {
    params,
  });

  return response.data.data;
}

export async function getMyCoupons(params: CouponHistoryQuery = {}) {
  const response = await apiClient.get<ApiResponse<CouponHistoryPage>>('/me/coupons', {
    params,
  });

  return response.data.data;
}
