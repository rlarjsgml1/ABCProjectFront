// 관리자용 회원 목록/상세 조회, 회원 상태 변경, 포인트 조정 API 클라이언트
import { apiClient } from './apiClient';
import type {
  AdminMemberDetail,
  AdminMemberDetailTab,
  AdminMemberListQuery,
  AdminMemberPaymentHistory,
  AdminMemberPointHistory,
  AdminMemberRentalHistory,
  AdminMemberReportHistory,
  AdminMemberSanctionHistory,
  AdminMemberStatusChangeRequest,
  AdminMemberStatusChangeResponse,
  AdminMemberSummary,
  AdminMemberTabResponse,
  AdminPointAdjustRequest,
  AdminPointAdjustResponse,
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
  const response = await apiClient.get<ApiResponse<AdminMemberDetail>>(`/admin/members/${memberId}`, {
    params: { tab: 'DEFAULT' satisfies AdminMemberDetailTab },
  });

  return response.data.data;
}

export async function getAdminMemberRentals(memberId: number, page = 0, size = 20) {
  const response = await apiClient.get<ApiResponse<AdminMemberTabResponse<AdminMemberRentalHistory>>>(
    `/admin/members/${memberId}`,
    { params: { tab: 'RENTALS' satisfies AdminMemberDetailTab, page, size } },
  );

  return response.data.data;
}

export async function getAdminMemberPayments(memberId: number, page = 0, size = 20) {
  const response = await apiClient.get<ApiResponse<AdminMemberTabResponse<AdminMemberPaymentHistory>>>(
    `/admin/members/${memberId}`,
    { params: { tab: 'PAYMENTS' satisfies AdminMemberDetailTab, page, size } },
  );

  return response.data.data;
}

export async function getAdminMemberReports(memberId: number, page = 0, size = 20) {
  const response = await apiClient.get<ApiResponse<AdminMemberTabResponse<AdminMemberReportHistory>>>(
    `/admin/members/${memberId}`,
    { params: { tab: 'REPORTS' satisfies AdminMemberDetailTab, page, size } },
  );

  return response.data.data;
}

export async function getAdminMemberPoints(memberId: number, page = 0, size = 20) {
  const response = await apiClient.get<ApiResponse<AdminMemberTabResponse<AdminMemberPointHistory>>>(
    `/admin/members/${memberId}`,
    { params: { tab: 'POINTS' satisfies AdminMemberDetailTab, page, size } },
  );

  return response.data.data;
}

export async function getAdminMemberSanctions(memberId: number, page = 0, size = 20) {
  const response = await apiClient.get<ApiResponse<AdminMemberTabResponse<AdminMemberSanctionHistory>>>(
    `/admin/members/${memberId}`,
    { params: { tab: 'SANCTIONS' satisfies AdminMemberDetailTab, page, size } },
  );

  return response.data.data;
}

export async function changeAdminMemberStatus(memberId: number, payload: AdminMemberStatusChangeRequest) {
  const response = await apiClient.patch<ApiResponse<AdminMemberStatusChangeResponse>>(`/admin/members/${memberId}/status`, payload);

  return response.data.data;
}

export async function adjustAdminMemberPoint(memberId: number, payload: AdminPointAdjustRequest) {
  const response = await apiClient.post<ApiResponse<AdminPointAdjustResponse>>(`/admin/members/${memberId}/points`, payload);

  return response.data.data;
}
