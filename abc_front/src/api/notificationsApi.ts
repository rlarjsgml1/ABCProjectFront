import { apiClient } from './apiClient';
import type {
  ApiResponse,
  NotificationItem,
  NotificationListQuery,
  NotificationPage,
  NotificationReadResult,
  NotificationType,
} from '../types/api';

export const NOTIFICATIONS_UPDATED_EVENT = 'abc-notifications-updated';

export async function getMyNotifications(params: NotificationListQuery = {}) {
  const response = await apiClient.get<ApiResponse<NotificationPage>>('/me/notifications', {
    params,
  });

  return response.data.data;
}

export async function markNotificationRead(notificationId: number) {
  const response = await apiClient.patch<ApiResponse<NotificationReadResult>>(
    `/me/notifications/${notificationId}/read`,
  );

  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));

  return response.data.data;
}

// 알림 유형 → 클릭 시 이동 경로 (화면흐름도 U-019 알림 대상 표 기준). NOTICE는 페이지 이동이 아니라 상세 모달을 띄운다.
export function getNotificationTargetPath(notification: Pick<NotificationItem, 'notificationType' | 'targetId'>) {
  switch (notification.notificationType) {
    case 'RENTAL':
      return '/me/rentals';
    case 'PAYMENT':
      return '/me/payments';
    case 'REPORT':
      return '/me/reports';
    case 'BOOK_REQUEST':
      return '/me/book-requests/history';
    case 'COUPON':
      return '/me/points-coupons';
    case 'CHALLENGE':
      return '/me/challenges';
    case 'EVENT':
      return notification.targetId ? `/books?collectionId=${notification.targetId}` : '/books?section=event';
    case 'NOTICE':
      return null;
    default:
      return null;
  }
}

const notificationTypeLabels: Record<NotificationType, string> = {
  RENTAL: '대여',
  PAYMENT: '결제',
  NOTICE: '공지',
  EVENT: '이벤트',
  REPORT: '신고 처리 결과',
  BOOK_REQUEST: '희망도서',
  COUPON: '쿠폰',
  CHALLENGE: '챌린지',
};

export function getNotificationTypeLabel(notificationType: NotificationType) {
  return notificationTypeLabels[notificationType] ?? notificationType;
}

const fallbackNotifications: NotificationItem[] = [
  {
    notificationId: 105,
    notificationType: 'RENTAL',
    title: '「달러구트 꿈 백화점」 대여 기간이 3일 남았습니다',
    targetType: 'BOOK_RENTAL',
    targetId: 41,
    readYn: false,
    createdAt: '2026-07-12T09:12:00',
    readAt: null,
  },
  {
    notificationId: 104,
    notificationType: 'COUPON',
    title: '7일 연속 출석 쿠폰이 발급되었습니다',
    targetType: 'MEMBER_COUPON',
    targetId: 12,
    readYn: false,
    createdAt: '2026-07-12T08:00:00',
    readAt: null,
  },
  {
    notificationId: 103,
    notificationType: 'CHALLENGE',
    title: '이달의 완독 챌린지 보상을 받을 수 있어요',
    targetType: 'CHALLENGE',
    targetId: 4,
    readYn: true,
    createdAt: '2026-07-10T11:20:00',
    readAt: '2026-07-10T12:00:00',
  },
  {
    notificationId: 102,
    notificationType: 'REPORT',
    title: '신고하신 리뷰 처리가 완료되었습니다',
    targetType: 'REVIEW_REPORT',
    targetId: 9,
    readYn: true,
    createdAt: '2026-07-09T10:05:00',
    readAt: '2026-07-09T10:30:00',
  },
  {
    notificationId: 101,
    notificationType: 'NOTICE',
    title: '8월 정기 점검 안내',
    targetType: 'NOTICE',
    targetId: 3,
    readYn: true,
    createdAt: '2026-07-02T09:00:00',
    readAt: '2026-07-02T13:15:00',
  },
];

export function getFallbackNotificationPage(query: NotificationListQuery = {}): NotificationPage {
  const page = query.page ?? 0;
  const size = query.size ?? 10;

  const filtered = fallbackNotifications.filter((notification) => {
    if (typeof query.readYn === 'boolean' && notification.readYn !== query.readYn) {
      return false;
    }

    if (query.notificationType && notification.notificationType !== query.notificationType) {
      return false;
    }

    return true;
  });

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;

  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
  };
}
