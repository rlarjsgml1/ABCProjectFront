import { apiClient } from './apiClient';
import type {
  AdminMemberListQuery,
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

export async function changeAdminMemberStatus(memberId: number, payload: AdminMemberStatusChangeRequest) {
  const response = await apiClient.patch<ApiResponse<AdminMemberStatusChangeResponse>>(`/admin/members/${memberId}/status`, payload);

  return response.data.data;
}
