import { apiClient } from './apiClient';
import type {
  AdminReportListQuery,
  AdminReportPage,
  AdminReportStatusUpdateRequest,
  AdminReportStatusUpdateResponse,
  ApiResponse,
  ReportTargetType,
} from '../types/api';

export async function getAdminReports(query: AdminReportListQuery) {
  const response = await apiClient.get<ApiResponse<AdminReportPage>>('/admin/reports', {
    params: query,
  });

  return response.data.data;
}

export async function updateAdminReportStatus(targetType: ReportTargetType, reportId: number, payload: AdminReportStatusUpdateRequest) {
  const response = await apiClient.patch<ApiResponse<AdminReportStatusUpdateResponse>>(`/admin/reports/${targetType}/${reportId}/status`, payload);

  return response.data.data;
}
