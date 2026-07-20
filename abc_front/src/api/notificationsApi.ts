// 알림 목록 조회/읽음 처리 API와 알림 유형별 라벨·이동 경로 매핑
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
