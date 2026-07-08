import { apiClient } from './apiClient';
import type {
  ApiResponse,
  BookmarkCreateRequest,
  BookmarkDeleteResult,
  BookmarkItem,
  ProgressResult,
  ProgressUpdateRequest,
  ViewerPageData,
} from '../types/api';

export async function getViewerPage(rentalId: number, pageNo: number) {
  const response = await apiClient.get<ApiResponse<ViewerPageData>>(`/rentals/${rentalId}/pages/${pageNo}`);
  return response.data.data;
}

export async function saveReadingProgress(rentalId: number, payload: ProgressUpdateRequest) {
  const response = await apiClient.put<ApiResponse<ProgressResult>>(`/rentals/${rentalId}/progress`, payload);
  return response.data.data;
}

export async function getBookmarks(rentalId: number) {
  const response = await apiClient.get<ApiResponse<BookmarkItem[]>>(`/rentals/${rentalId}/bookmarks`);
  return response.data.data;
}

export async function addBookmark(rentalId: number, payload: BookmarkCreateRequest) {
  const response = await apiClient.post<ApiResponse<BookmarkItem>>(`/rentals/${rentalId}/bookmarks`, payload);
  return response.data.data;
}

export async function deleteBookmark(rentalId: number, bookmarkId: number) {
  const response = await apiClient.delete<ApiResponse<BookmarkDeleteResult>>(
    `/rentals/${rentalId}/bookmarks/${bookmarkId}`,
  );
  return response.data.data;
}
