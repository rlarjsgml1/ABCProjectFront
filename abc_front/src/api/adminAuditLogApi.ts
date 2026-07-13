// 관리자용 감사 로그 조회 API 클라이언트 — AdminAuditLogController에 실제 연동됨. 조회 전용.
import { apiClient } from './apiClient';
import type { AdminAuditLogPage, AdminAuditLogQuery, ApiResponse } from '../types/api';

export async function getAdminAuditLogs(query: AdminAuditLogQuery) {
  const response = await apiClient.get<ApiResponse<AdminAuditLogPage>>('/admin/audit-logs', {
    params: query,
  });

  return response.data.data;
}
