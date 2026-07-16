// 관리자 도서관 위치 관리(A-015) API 클라이언트.
// 백엔드 미구현. api-spec(final).md API-ADMIN-LIBRARY-001~003 스펙으로 요청해둔 상태 — 구현되면 바로 연동됨.
import { apiClient } from './apiClient';
import type {
  AdminLibraryBooksUpdateRequest,
  AdminLibraryBooksUpdateResponse,
  AdminLibraryListQuery,
  AdminLibrarySummary,
  AdminLibraryUpdateRequest,
  AdminLibraryUpdateResponse,
  ApiResponse,
  PageResponse,
} from '../types/api';

export async function getAdminLibraries(query: AdminLibraryListQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminLibrarySummary>>>('/admin/libraries', {
    params: query,
  });

  return response.data.data;
}

export async function updateAdminLibrary(libraryId: number, payload: AdminLibraryUpdateRequest) {
  const response = await apiClient.put<ApiResponse<AdminLibraryUpdateResponse>>(
    `/admin/libraries/${libraryId}`,
    payload,
  );

  return response.data.data;
}

export async function updateAdminLibraryBooks(libraryId: number, payload: AdminLibraryBooksUpdateRequest) {
  const response = await apiClient.put<ApiResponse<AdminLibraryBooksUpdateResponse>>(
    `/admin/libraries/${libraryId}/books`,
    payload,
  );

  return response.data.data;
}
