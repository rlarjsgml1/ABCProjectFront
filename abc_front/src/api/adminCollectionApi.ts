import { apiClient } from './apiClient';
import type {
  AdminCollectionBooksSaveRequest,
  AdminCollectionBooksSaveResponse,
  AdminCollectionDetail,
  AdminCollectionItem,
  AdminCollectionListQuery,
  AdminCollectionPatchRequest,
  AdminCollectionPatchResponse,
  AdminCollectionSaveRequest,
  AdminCollectionSaveResponse,
  ApiResponse,
  PageResponse,
} from '../types/api';

export async function getAdminCollections(query: AdminCollectionListQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminCollectionItem>>>('/admin/collections', {
    params: query,
  });

  return response.data.data;
}

export async function getAdminCollectionDetail(collectionId: number) {
  const response = await apiClient.get<ApiResponse<AdminCollectionDetail>>(`/admin/collections/${collectionId}`);

  return response.data.data;
}

export async function createAdminCollection(payload: AdminCollectionSaveRequest) {
  const response = await apiClient.post<ApiResponse<AdminCollectionSaveResponse>>('/admin/collections', payload);

  return response.data.data;
}

export async function saveAdminCollection(collectionId: number, payload: AdminCollectionSaveRequest) {
  const response = await apiClient.put<ApiResponse<AdminCollectionSaveResponse>>(
    `/admin/collections/${collectionId}`,
    payload,
  );

  return response.data.data;
}

export async function saveAdminCollectionBooks(collectionId: number, payload: AdminCollectionBooksSaveRequest) {
  const response = await apiClient.put<ApiResponse<AdminCollectionBooksSaveResponse>>(
    `/admin/collections/${collectionId}/books`,
    payload,
  );

  return response.data.data;
}

export async function patchAdminCollection(collectionId: number, payload: AdminCollectionPatchRequest) {
  const response = await apiClient.patch<ApiResponse<AdminCollectionPatchResponse>>(
    `/admin/collections/${collectionId}`,
    payload,
  );

  return response.data.data;
}
