// 내가 접수한 신고 내역 조회 API 클라이언트
import { apiClient } from './apiClient';
import type { ApiResponse, ReportHistoryPage, ReportHistoryQuery } from '../types/api';

export async function getMyReports(params: ReportHistoryQuery = {}) {
  const response = await apiClient.get<ApiResponse<ReportHistoryPage>>('/me/reports', {
    params,
  });

  return response.data.data;
}
