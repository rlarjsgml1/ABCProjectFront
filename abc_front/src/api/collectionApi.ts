import { apiClient } from './apiClient';
import type { ApiResponse, CollectionDetail, CollectionListQuery, CollectionSummary, PageResponse } from '../types/api';

export async function getCollections(query: CollectionListQuery = {}) {
  const response = await apiClient.get<ApiResponse<PageResponse<CollectionSummary>>>('/collections', {
    params: query,
  });

  const data = response.data.data;

  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: data?.page ?? query.page ?? 0,
    size: data?.size ?? query.size ?? 0,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    last: data?.last ?? true,
  };
}

export async function getCollectionDetail(collectionId: number) {
  const response = await apiClient.get<ApiResponse<CollectionDetail>>(`/collections/${collectionId}`);

  return response.data.data;
}
