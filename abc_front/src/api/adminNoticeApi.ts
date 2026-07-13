// 관리자용 공지 목록 조회 및 등록/수정 API 클라이언트 — controller 미구현으로 페이지에서 fallback과 함께 사용
import { apiClient } from './apiClient';
import type { AdminNoticeItem, AdminNoticeListQuery, AdminNoticePage, AdminNoticeSaveRequest, ApiResponse } from '../types/api';

export async function getAdminNotices(query: AdminNoticeListQuery) {
  const response = await apiClient.get<ApiResponse<AdminNoticePage>>('/admin/notices', {
    params: query,
  });

  return response.data.data;
}

export async function createAdminNotice(payload: AdminNoticeSaveRequest) {
  const response = await apiClient.post<ApiResponse<AdminNoticeItem>>('/admin/notices', payload);

  return response.data.data;
}

export async function updateAdminNotice(noticeId: number, payload: AdminNoticeSaveRequest) {
  const response = await apiClient.put<ApiResponse<AdminNoticeItem>>(`/admin/notices/${noticeId}`, payload);

  return response.data.data;
}
