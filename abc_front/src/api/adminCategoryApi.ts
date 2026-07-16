import { apiClient } from './apiClient';
import type { AdminCategoryItem, AdminCategorySaveRequest, AdminCategorySaveResponse, ApiResponse } from '../types/api';

export async function getAdminCategories() {
  const response = await apiClient.get<ApiResponse<AdminCategoryItem[]>>('/admin/categories');

  return response.data.data;
}

export async function saveAdminCategory(categoryId: number, payload: AdminCategorySaveRequest) {
  const response = await apiClient.put<ApiResponse<AdminCategorySaveResponse>>(
    `/admin/categories/${categoryId}`,
    payload,
  );

  return response.data.data;
}
