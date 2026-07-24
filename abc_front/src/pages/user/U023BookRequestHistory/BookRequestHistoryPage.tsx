// 희망도서 신청 내역(U023) 화면 — 내가 신청한 희망도서 목록을 상태별로 조회하고 상세 내용을 확인한다
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookRequests } from '../../../api/bookRequestsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Modal } from '../../../components/common/Modal';
import { Table } from '../../../components/common/Table';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { BookRequestHistoryItem, BookRequestHistoryPage as BookRequestHistoryPageType, BookRequestStatus } from '../../../types/api';

const pageSize = 10;

const statusOptions: Array<{ label: string; value: BookRequestStatus | '' }> = [
  { label: '전체', value: '' },
  { label: '신청', value: 'REQUESTED' },
  { label: '검토 중', value: 'IN_REVIEW' },
  { label: '승인', value: 'APPROVED' },
  { label: '반려', value: 'REJECTED' },
];

function formatDate(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

function getStatusLabel(value: BookRequestStatus) {
  const option = statusOptions.find((item) => item.value === value);
  return option?.label ?? value;
}

export function BookRequestHistoryPage() {
  const [status, setStatus] = useState<BookRequestStatus | ''>('');
  const [requestsPage, setRequestsPage] = useState<BookRequestHistoryPageType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<BookRequestHistoryItem | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadRequests() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getMyBookRequests({ status: status || undefined, page: 0, size: pageSize });
        if (!ignore) {
          setRequestsPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setRequestsPage(null);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadRequests();

    return () => {
      ignore = true;
    };
  }, [status]);

  const requests = requestsPage?.content ?? [];

  return (
    <MyPageLayout titleId="book-request-history-title">
      <section className="page-section book-request-history-page">
        <div className="section-heading-row">
          <div>
            <h2 id="book-request-history-title">희망도서 신청 내역</h2>
          </div>
          <Link className="button button-primary" to="/me/book-requests">
            새 희망도서 신청
          </Link>
        </div>

        <div className="points-coupons-toolbar">
          <label>
            <span>상태</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as BookRequestStatus | '')}>
              {statusOptions.map((option) => (
                <option key={option.value || 'ALL'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

        <Table<BookRequestHistoryItem>
          columns={[
            { key: 'title', header: '제목', maxWidth: '280px' },
            { key: 'author', header: '저자' },
            { key: 'publisher', header: '출판사' },
            { key: 'createdAt', header: '신청일', render: (item) => formatDate(item.createdAt) },
            { key: 'status', header: '상태', render: (item) => getStatusLabel(item.status) },
            {
              key: 'detail',
              header: '상세',
              render: (item) => (
                <button type="button" className="button button-secondary" onClick={() => setSelectedRequest(item)}>
                  상세보기
                </button>
              ),
            },
          ]}
          rows={requests}
          rowKey={(item) => item.requestId}
          isLoading={isLoading}
          loadingMessage="희망도서 신청 내역을 불러오는 중입니다."
          emptyMessage="희망도서 신청 내역이 없습니다."
        />
      </section>

      <Modal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        eyebrow="BOOK REQUEST DETAIL"
        title="희망도서 신청 상세"
        titleId="book-request-detail-title"
        closeLabel="희망도서 신청 상세 닫기"
      >
        {selectedRequest ? (
          <>
            <p>제목 {selectedRequest.title}</p>
            <p>신청 사유 {selectedRequest.reason ?? '-'}</p>
            <p>후보 신청자 수 {selectedRequest.requestCount}명</p>
            <p>상태 {getStatusLabel(selectedRequest.status)}</p>
            {selectedRequest.status === 'APPROVED' && selectedRequest.approvedBookId ? (
              <p>
                <Link to={`/books/${selectedRequest.approvedBookId}`}>승인 도서 보기</Link>
              </p>
            ) : null}
            {selectedRequest.status === 'REJECTED' ? <p>반려 사유 {selectedRequest.rejectReason ?? '-'}</p> : null}
          </>
        ) : null}
      </Modal>
    </MyPageLayout>
  );
}
