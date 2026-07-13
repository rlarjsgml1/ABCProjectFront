// 내 대여 현황 화면(U010) — 대여 중/완료 목록 조회, 이어보기, 반납 예정일 표시를 담당한다.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRentals } from '../../../api/myRentalsApi';
import { getBookDetail } from '../../../api/bookApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Table } from '../../../components/common/Table';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { MyRentalItem, RentalStatus } from '../../../types/api';

type RentalCardData = MyRentalItem & {
  author?: string;
  publisher?: string;
};

const rentalStatusLabels: Record<RentalStatus, string> = {
  READY: '읽기 전',
  READING: '읽는 중',
  OWNED: '소장',
};

function formatProgress(current: number, total: number) {
  if (total <= 0) {
    return '0%';
  }

  return `${Math.min(100, Math.round((current / total) * 100))}%`;
}

function formatDate(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

function formatDday(value: string) {
  const end = new Date(value);

  if (Number.isNaN(end.getTime())) {
    return '';
  }

  const today = new Date();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((endDay.getTime() - todayDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `D-${diffDays}`;
  }

  if (diffDays === 0) {
    return 'D-Day';
  }

  return `D+${Math.abs(diffDays)}`;
}

function getContinuePath(item: MyRentalItem) {
  const targetPage = item.currentPage > 0 ? item.currentPage : 1;
  return `/rentals/${item.rentalId}/read?page=${targetPage}`;
}

function getContinueLabel(item: MyRentalItem) {
  return item.currentPage > 0 ? '이어보기' : '처음부터 읽기';
}

export function MyRentalsPage() {
  const [rentals, setRentals] = useState<RentalCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadRentals() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getMyRentals({ page: 0, size: 50 });
        const uniqueBookIds = Array.from(new Set(data.content.map((item) => item.bookId)));
        const bookDetails = await Promise.all(
          uniqueBookIds.map((bookId) =>
            getBookDetail(bookId).catch(() => null),
          ),
        );
        const bookDetailMap = new Map(
          uniqueBookIds.map((bookId, index) => [bookId, bookDetails[index]]),
        );

        if (!ignore) {
          setRentals(
            data.content.map((item) => ({
              ...item,
              author: bookDetailMap.get(item.bookId)?.author,
              publisher: bookDetailMap.get(item.bookId)?.publisher,
            })),
          );
        }
      } catch (error) {
        if (!ignore) {
          setRentals([]);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadRentals();

    return () => {
      ignore = true;
    };
  }, []);

  const activeRentals = rentals.filter((item) => item.rentalStatus === 'READING');
  const isActiveEmpty = !isLoading && activeRentals.length === 0;

  return (
    <MyPageLayout titleId="my-rentals-title">
      <section className="page-section my-rentals-page">
        <div className="section-heading-row">
          <div>
            <h2 id="my-rentals-title">내 대여 현황</h2>
            <p className="my-rentals-subtitle">현재 대여 중인 책과 대여 내역을 확인할 수 있습니다.</p>
          </div>
        </div>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}
        {isLoading ? <div className="status-banner">대여 현황을 불러오는 중입니다.</div> : null}

        <h3 className="my-rentals-section-title">대여 중인 책 {activeRentals.length}권</h3>

        {isActiveEmpty ? (
          <div className="form-card recent-books-empty">
            <p>현재 읽는 중인 책이 없습니다.</p>
            <Link to="/books" className="browse-button">
              도서 둘러보기
            </Link>
          </div>
        ) : null}

        {activeRentals.length > 0 ? (
          <div className="recent-books-list">
            {activeRentals.map((item) => (
              <article key={item.rentalId} className="recent-book-card">
                <Link to={`/books/${item.bookId}`} className="recent-book-cover-link">
                  <img className="book-cover-thumb" src={item.coverImageUrl} alt={`${item.title} 표지`} />
                </Link>

                <div className="recent-book-info">
                  <Link to={`/books/${item.bookId}`} className="recent-book-title">
                    {item.title}
                  </Link>

                  <p className="recent-book-progress-text">
                    {item.author ?? '-'} | {item.publisher ?? '-'}
                  </p>

                  <p className="recent-book-progress-text">
                    읽기 | 진행률 {formatProgress(item.currentPage, item.totalPages)}
                  </p>

                  <div className="recent-book-progress-track">
                    <span
                      className="recent-book-progress-fill"
                      style={{ width: formatProgress(item.currentPage, item.totalPages) }}
                    />
                  </div>

                  <p className="recent-book-last-read">
                    반납 예정일 {formatDate(item.rentalEndAt)} ({formatDday(item.rentalEndAt)})
                  </p>
                </div>

                <div className="my-rentals-actions">
                  <Link to={getContinuePath(item)} className="button button-primary">
                    {getContinueLabel(item)}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <h3 className="my-rentals-section-title">대여 내역</h3>

        <Table<RentalCardData>
          columns={[
            { key: 'title', header: '책 제목', render: (item) => <Link to={`/books/${item.bookId}`}>{item.title}</Link> },
            { key: 'author', header: '저자', render: (item) => item.author ?? '-' },
            { key: 'rentalEndAt', header: '반납 예정일', render: (item) => formatDate(item.rentalEndAt) },
            { key: 'rentalStatus', header: '상태', render: (item) => rentalStatusLabels[item.rentalStatus] },
          ]}
          rows={rentals}
          rowKey={(item) => item.rentalId}
          isLoading={isLoading}
          loadingMessage="대여 내역을 불러오는 중입니다."
          emptyMessage="대여 내역이 없습니다."
        />
      </section>
    </MyPageLayout>
  );
}
