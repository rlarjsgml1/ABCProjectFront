import { isAxiosError } from 'axios';
import { apiClient } from './apiClient';
import type {
  ApiResponse,
  BookmarkCreateRequest,
  BookmarkDeleteResult,
  BookmarkItem,
  ProgressResult,
  ProgressUpdateRequest,
  ViewerSessionData,
} from '../types/api';

type ViewerErrorPayload = {
  code?: string;
  message?: string;
};

export class ViewerApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ViewerApiError';
  }
}

function parseErrorPayload(value: unknown): ViewerErrorPayload | null {
  if (value instanceof ArrayBuffer) {
    try {
      return JSON.parse(new TextDecoder().decode(value)) as ViewerErrorPayload;
    } catch {
      return null;
    }
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as ViewerErrorPayload;
    } catch {
      return { message: value };
    }
  }

  if (value && typeof value === 'object') {
    return value as ViewerErrorPayload;
  }

  return null;
}

function toViewerApiError(error: unknown) {
  if (error instanceof ViewerApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const payload = parseErrorPayload(error.response?.data);
    const fallbackMessage =
      status === 401
        ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
        : status === 403
          ? '대여 기간이 만료되었거나 열람 권한이 없습니다.'
          : status === 404
            ? '등록된 EPUB 파일을 찾을 수 없습니다.'
            : '전자책을 불러오지 못했습니다.';

    return new ViewerApiError(payload?.message || fallbackMessage, status, payload?.code);
  }

  return new ViewerApiError(error instanceof Error ? error.message : '전자책 요청을 처리하지 못했습니다.');
}

async function requestViewer<T>(request: () => Promise<T>) {
  try {
    return await request();
  } catch (error) {
    throw toViewerApiError(error);
  }
}

export async function getViewerSession(rentalId: number, signal?: AbortSignal) {
  return requestViewer(async () => {
    const response = await apiClient.get<ApiResponse<ViewerSessionData>>(`/rentals/${rentalId}/viewer`, { signal });
    return response.data.data;
  });
}

export async function getViewerEpub(rentalId: number, signal?: AbortSignal) {
  return requestViewer(async () => {
    const response = await apiClient.get<ArrayBuffer>(`/rentals/${rentalId}/epub`, {
      responseType: 'arraybuffer',
      signal,
    });
    return response.data;
  });
}

export async function saveReadingProgress(rentalId: number, payload: ProgressUpdateRequest) {
  return requestViewer(async () => {
    const response = await apiClient.put<ApiResponse<ProgressResult>>(`/rentals/${rentalId}/progress`, payload);
    return response.data.data;
  });
}

export async function getBookmarks(rentalId: number) {
  return requestViewer(async () => {
    const response = await apiClient.get<ApiResponse<BookmarkItem[]>>(`/rentals/${rentalId}/bookmarks`);
    return response.data.data;
  });
}

export async function addBookmark(rentalId: number, payload: BookmarkCreateRequest) {
  return requestViewer(async () => {
    const response = await apiClient.post<ApiResponse<BookmarkItem>>(`/rentals/${rentalId}/bookmarks`, payload);
    return response.data.data;
  });
}

export async function deleteBookmark(rentalId: number, bookmarkId: number) {
  return requestViewer(async () => {
    const response = await apiClient.delete<ApiResponse<BookmarkDeleteResult>>(
      `/rentals/${rentalId}/bookmarks/${bookmarkId}`,
    );
    return response.data.data;
  });
}
