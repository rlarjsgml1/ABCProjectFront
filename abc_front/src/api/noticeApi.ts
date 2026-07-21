// 공지사항 목록/상세 조회 API
import { apiClient } from './apiClient';
import type { ApiResponse, NoticeDetail, NoticeListQuery, NoticePage } from '../types/api';

export async function getNotices(page = 0, size = 10, query: NoticeListQuery = {}) {
  const response = await apiClient.get<ApiResponse<NoticePage>>('/notices', {
    params: { page, size, ...query },
  });

  const data = response.data.data;
  if (!data?.content) {
    throw new Error('Invalid notices response');
  }

  return data;
}

export async function getNoticeDetail(noticeId: number) {
  const response = await apiClient.get<ApiResponse<NoticeDetail>>(`/notices/${noticeId}`);

  const data = response.data.data;
  if (!data) {
    throw new Error('Invalid notice detail response');
  }

  return data;
}
