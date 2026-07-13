// 관리자용 통계 조회 API 클라이언트 — AdminStatisticController에 실제 연동됨. 현재 periodType=TOTAL(+ageBand 미지정/ALL)만 지원.
import { apiClient } from './apiClient';
import type { AdminStatisticsData, AdminStatisticsQuery, ApiResponse } from '../types/api';

export async function getAdminStatistics(query: AdminStatisticsQuery) {
  const response = await apiClient.get<ApiResponse<AdminStatisticsData>>('/admin/statistics', {
    params: query,
  });

  return response.data.data;
}
