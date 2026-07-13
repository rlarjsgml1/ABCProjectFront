import { apiClient } from './apiClient';
import type {
  AdminBookRequestCandidatePage,
  AdminBookRequestCandidateQuery,
  AdminBookRequestStatusUpdateRequest,
  AdminBookRequestStatusUpdateResponse,
  ApiResponse,
} from '../types/api';

export async function getAdminBookRequestCandidates(query: AdminBookRequestCandidateQuery) {
  const response = await apiClient.get<ApiResponse<AdminBookRequestCandidatePage>>('/admin/book-request-candidates', {
    params: query,
  });

  return response.data.data;
}

export async function updateAdminBookRequestCandidateStatus(candidateId: number, payload: AdminBookRequestStatusUpdateRequest) {
  const response = await apiClient.patch<ApiResponse<AdminBookRequestStatusUpdateResponse>>(`/admin/book-request-candidates/${candidateId}/status`, payload);

  return response.data.data;
}
