import { apiClient } from './apiClient';
import type { ApiResponse, NoticeDetail, NoticeItem, NoticeListQuery, NoticePage } from '../types/api';

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

const fallbackTitles = [
  'ABC 서비스 정기 점검 안내',
  '신규 도서 입고 안내',
  '개인정보처리방침 개정 안내',
  '여름 휴가철 고객센터 운영시간 안내',
  '전자책 뷰어 업데이트 안내',
  '포인트 및 쿠폰 정책 변경 안내',
  '앱 버전 업데이트 안내',
  '결제 시스템 점검 안내',
  '도서관 방문 대여 서비스 안내',
  '독서 챌린지 이벤트 안내',
];

const FALLBACK_COUNT = 10;

function fallbackNoticeContent(title: string) {
  return [
    '안녕하세요, ABC입니다.',
    '',
    'ABC를 이용해주시는 고객 여러분께 감사드리며, 아래와 같이 안내드립니다.',
    '',
    `- ${title}`,
    '- 자세한 내용은 고객센터로 문의해 주시기 바랍니다.',
    '',
    '더 나은 서비스로 찾아 뵐 수 있도록 노력하겠습니다.',
    '감사합니다.',
  ].join('\n');
}

const fallbackNotices: NoticeItem[] = Array.from({ length: FALLBACK_COUNT }, (_, index) => {
  const noticeId = FALLBACK_COUNT - index;
  const title = `[공지] ${fallbackTitles[index % fallbackTitles.length]} (${noticeId})`;

  return {
    noticeId,
    title,
    content: fallbackNoticeContent(title),
    createdAt: '2026-06-22',
  };
});

export function getFallbackNoticePage(page: number, size: number): NoticePage {
  const totalElements = fallbackNotices.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;

  return {
    content: fallbackNotices.slice(start, start + size),
    page,
    size,
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
  };
}

function toNeighbor(notice: NoticeItem) {
  return { noticeId: notice.noticeId, title: notice.title };
}

export function getFallbackNoticeDetail(noticeId: number): NoticeDetail | null {
  const index = fallbackNotices.findIndex((notice) => notice.noticeId === noticeId);
  if (index === -1) {
    return null;
  }

  const notice = fallbackNotices[index];

  return {
    ...notice,
    prevNotice: index > 0 ? toNeighbor(fallbackNotices[index - 1]) : null,
    nextNotice: index < fallbackNotices.length - 1 ? toNeighbor(fallbackNotices[index + 1]) : null,
  };
}
