import { apiClient } from './apiClient';
import type {
  AdminCollectionBooksSaveRequest,
  AdminCollectionItem,
  AdminCollectionListQuery,
  AdminCollectionPatchRequest,
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

export async function saveAdminCollection(collectionId: number, payload: AdminCollectionSaveRequest) {
  const response = await apiClient.put<ApiResponse<AdminCollectionSaveResponse>>(
    `/admin/collections/${collectionId}`,
    payload,
  );

  return response.data.data;
}

export async function saveAdminCollectionBooks(collectionId: number, payload: AdminCollectionBooksSaveRequest) {
  const response = await apiClient.put<ApiResponse<AdminCollectionSaveResponse>>(
    `/admin/collections/${collectionId}/books`,
    payload,
  );

  return response.data.data;
}

export async function patchAdminCollection(collectionId: number, payload: AdminCollectionPatchRequest) {
  const response = await apiClient.patch<ApiResponse<AdminCollectionSaveResponse>>(
    `/admin/collections/${collectionId}`,
    payload,
  );

  return response.data.data;
}
