// 관리자용 회원 목록/상세 조회, 회원 상태 변경, 포인트 조정 API 클라이언트
import { apiClient } from './apiClient';
import type {
  AdminMemberDetail,
  AdminMemberListQuery,
  AdminMemberPointAdjustRequest,
  AdminMemberPointAdjustResponse,
  AdminMemberStatusChangeRequest,
  AdminMemberStatusChangeResponse,
  AdminMemberSummary,
  ApiResponse,
  PageResponse,
} from '../types/api';

export async function getAdminMembers(query: AdminMemberListQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminMemberSummary>>>('/admin/members', {
    params: query,
  });

  return response.data.data;
}

export async function getAdminMember(memberId: number) {
  const response = await apiClient.get<ApiResponse<AdminMemberDetail>>(`/admin/members/${memberId}`);

  return response.data.data;
}

export async function changeAdminMemberStatus(memberId: number, payload: AdminMemberStatusChangeRequest) {
  const response = await apiClient.patch<ApiResponse<AdminMemberStatusChangeResponse>>(`/admin/members/${memberId}/status`, payload);

  return response.data.data;
}

export async function adjustAdminMemberPoint(memberId: number, payload: AdminMemberPointAdjustRequest) {
  const response = await apiClient.post<ApiResponse<AdminMemberPointAdjustResponse>>(`/admin/members/${memberId}/points`, payload);

  return response.data.data;
}
