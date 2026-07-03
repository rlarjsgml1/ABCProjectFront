import { apiClient } from './apiClient';
import type {
  ApiResponse,
  CouponHistoryPage,
  CouponHistoryQuery,
  PointHistoryPage,
  PointHistoryQuery,
} from '../types/api';

export async function getMyPoints(params: PointHistoryQuery = {}) {
  const response = await apiClient.get<ApiResponse<PointHistoryPage>>('/me/points', {
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
