import { apiClient } from './apiClient';
import type { ApiResponse, CollectionDetail, CollectionListQuery, CollectionSummary, PageResponse } from '../types/api';

export async function getCollections(query: CollectionListQuery = {}) {
  const response = await apiClient.get<ApiResponse<PageResponse<CollectionSummary>>>('/collections', {
    params: query,
  });

  return response.data.data;
}

export async function getCollectionDetail(collectionId: number) {
  const response = await apiClient.get<ApiResponse<CollectionDetail>>(`/collections/${collectionId}`);

  return response.data.data;
}
