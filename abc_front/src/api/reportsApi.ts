import { apiClient } from './apiClient';
import type { ApiResponse, ReportHistoryPage, ReportHistoryQuery } from '../types/api';

export async function getMyReports(params: ReportHistoryQuery = {}) {
  const response = await apiClient.get<ApiResponse<ReportHistoryPage>>('/me/reports', {
    params,
  });

  return response.data.data;
}
