// 관리자용 공지 목록 조회 및 등록/수정 API 클라이언트
import { apiClient } from './apiClient';
import type {
  AdminNoticeCreateResponse,
  AdminNoticeItem,
  AdminNoticeListQuery,
  AdminNoticePage,
  AdminNoticeSaveRequest,
  ApiResponse,
} from '../types/api';

export async function getAdminNotices(query: AdminNoticeListQuery) {
  const response = await apiClient.get<ApiResponse<AdminNoticePage>>('/admin/notices', {
    params: query,
  });

  return response.data.data;
}

export async function createAdminNotice(payload: AdminNoticeSaveRequest) {
  const response = await apiClient.post<ApiResponse<AdminNoticeCreateResponse>>('/admin/notices', payload);

  return response.data.data;
}

export async function updateAdminNotice(noticeId: number, payload: AdminNoticeSaveRequest) {
  const response = await apiClient.put<ApiResponse<AdminNoticeItem>>(`/admin/notices/${noticeId}`, payload);

  return response.data.data;
}
