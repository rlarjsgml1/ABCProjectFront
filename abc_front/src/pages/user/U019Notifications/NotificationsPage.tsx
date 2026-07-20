// 알림 내역(U019) 화면 — 알림 목록을 필터링·페이징하여 조회하고 클릭 시 읽음 처리 및 관련 화면으로 이동시킨다
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getMyNotifications,
  getNotificationTargetPath,
  getNotificationTypeLabel,
  markNotificationRead,
} from '../../../api/notificationsApi';
import { getNoticeDetail } from '../../../api/noticeApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Modal } from '../../../components/common/Modal';
import { Pagination } from '../../../components/common/Pagination';
import { Table } from '../../../components/common/Table';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { NoticeDetail, NotificationItem, NotificationPage, NotificationType } from '../../../types/api';

const PAGE_SIZE = 10;

const typeOptions: Array<{ label: string; value: NotificationType | '' }> = [
  { label: '전체 유형', value: '' },
  { label: '대여', value: 'RENTAL' },
  { label: '결제', value: 'PAYMENT' },
  { label: '공지', value: 'NOTICE' },
  { label: '이벤트', value: 'EVENT' },
  { label: '신고 처리 결과', value: 'REPORT' },
  { label: '희망도서', value: 'BOOK_REQUEST' },
  { label: '쿠폰', value: 'COUPON' },
  { label: '챌린지', value: 'CHALLENGE' },
];

const typeIcons: Record<NotificationType, string> = {
  RENTAL: '📖',
  PAYMENT: '💳',
  NOTICE: '📢',
  EVENT: '🎉',
  REPORT: '🚩',
  BOOK_REQUEST: '📚',
  COUPON: '🎟',
  CHALLENGE: '🏆',
};

function formatDateTime(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(time);
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page') ?? '0');
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('');
  const [notificationsPage, setNotificationsPage] = useState<NotificationPage>({
    content: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<NoticeDetail | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadNotifications() {
      setIsLoading(true);

      const query = {
        readYn: readFilter === 'UNREAD' ? false : undefined,
        notificationType: typeFilter || undefined,
        page: currentPage,
        size: PAGE_SIZE,
      };

      try {
        const data = await getMyNotifications(query);
        if (!ignore) {
          setNotificationsPage(data);
          setErrorMessage('');
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      ignore = true;
    };
  }, [currentPage, readFilter, typeFilter]);

  function movePage(page: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  }

  function changeReadFilter(next: 'ALL' | 'UNREAD') {
    setReadFilter(next);
    movePage(0);
  }

  function changeTypeFilter(next: NotificationType | '') {
    setTypeFilter(next);
    movePage(0);
  }

  function markAsReadLocally(notificationId: number) {
    setNotificationsPage((current) => ({
      ...current,
      content: current.content.map((item) =>
        item.notificationId === notificationId ? { ...item, readYn: true, readAt: item.readAt ?? new Date().toISOString() } : item,
      ),
    }));
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (!notification.readYn) {
      try {
        await markNotificationRead(notification.notificationId);
        markAsReadLocally(notification.notificationId);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error));
      }
    }

    if (notification.notificationType === 'NOTICE') {
      const noticeId = notification.targetId;
      if (!noticeId) {
        return;
      }

      try {
        const detail = await getNoticeDetail(noticeId);
        setSelectedNotice(detail);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error));
      }

      return;
    }

    const targetPath = getNotificationTargetPath(notification);
    if (targetPath) {
      navigate(targetPath);
    }
  }

  const notifications = notificationsPage.content;
  const totalPages = Math.max(1, notificationsPage.totalPages);

  return (
    <MyPageLayout titleId="notifications-title">
      <section className="page-section notifications-page">
        <div className="section-heading-row">
          <div>
            <h2 id="notifications-title">알림 내역</h2>
          </div>
        </div>

        <div className="notifications-toolbar">
          <div className="notifications-filter-tabs" role="tablist" aria-label="읽음 상태 필터">
            <button
              type="button"
              role="tab"
              aria-selected={readFilter === 'ALL'}
              className={`notifications-filter-tab${readFilter === 'ALL' ? ' is-active' : ''}`}
              onClick={() => changeReadFilter('ALL')}
            >
              전체
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={readFilter === 'UNREAD'}
              className={`notifications-filter-tab${readFilter === 'UNREAD' ? ' is-active' : ''}`}
              onClick={() => changeReadFilter('UNREAD')}
            >
              읽지 않음
            </button>
          </div>

          <label>
            <span className="visually-hidden">알림 유형</span>
            <select value={typeFilter} onChange={(event) => changeTypeFilter(event.target.value as NotificationType | '')}>
              {typeOptions.map((option) => (
                <option key={option.value || 'ALL'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="notifications-heading-actions">
            <span className="ghost-note">API-NOTI-003 추가 후 활성화</span>
            <button className="button button-secondary" type="button" disabled aria-disabled="true">
              모두 읽기
            </button>
          </div>
        </div>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

        <Table<NotificationItem>
          className="notifications-table"
          columns={[
            {
              key: 'title',
              header: '알림',
              render: (notification) => (
                <button
                  type="button"
                  className={`notifications-row-button${notification.readYn ? '' : ' is-unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className={`notifications-icon notifications-icon-${notification.notificationType.toLowerCase()}`} aria-hidden="true">
                    {typeIcons[notification.notificationType]}
                  </span>
                  <span className="notifications-row-title">
                    {!notification.readYn ? <span className="notifications-unread-dot" aria-hidden="true" /> : null}
                    {notification.title}
                  </span>
                </button>
              ),
            },
            {
              key: 'notificationType',
              header: '유형',
              render: (notification) => (
                <span className="notifications-type-tag">{getNotificationTypeLabel(notification.notificationType)}</span>
              ),
            },
            {
              key: 'createdAt',
              header: '일시',
              align: 'right',
              render: (notification) => formatDateTime(notification.createdAt),
            },
          ]}
          rows={notifications}
          rowKey={(notification) => notification.notificationId}
          isLoading={isLoading}
          loadingMessage="알림을 불러오는 중입니다."
          emptyMessage="알림이 없습니다."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={movePage} />
      </section>

      <Modal
        isOpen={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        eyebrow="NOTICE"
        title="공지 상세"
        titleId="notification-notice-title"
        closeLabel="공지 상세 닫기"
      >
        {selectedNotice ? (
          <>
            <p>{selectedNotice.title}</p>
            <p style={{ whiteSpace: 'pre-line' }}>{selectedNotice.content}</p>
          </>
        ) : null}
      </Modal>
    </MyPageLayout>
  );
}
