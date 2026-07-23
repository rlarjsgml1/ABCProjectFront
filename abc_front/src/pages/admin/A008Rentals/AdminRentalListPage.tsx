// 대여 현황 관리(A008) 화면 — 전체 대여 상태와 읽기 진행률을 조회한다 (조회 전용, 상태 변경 UI 없음)
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAdminRentals } from '../../../api/adminRentalApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { AdminRentalItem, AdminRentalPage, AdminRentalStatus } from '../../../types/api';
import styles from '../../../styles/AdminOpsListPage.module.css';

const PAGE_SIZE = 10;

const statusOptions: Array<{ value: AdminRentalStatus; label: string }> = [
  { value: 'READY', label: '읽기 전' },
  { value: 'READING', label: '읽는 중' },
  { value: 'OWNED', label: '소장' },
];

const statusPillClass: Record<AdminRentalStatus, string> = {
  READY: styles.pillNeutral,
  READING: styles.pillPrimary,
  OWNED: styles.pillSuccess,
};

function getLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T | undefined) {
  return options.find((option) => option.value === value)?.label ?? value ?? '-';
}

function formatDate(value: string | undefined) {
  if (!value) return '-';
  return value.slice(0, 10);
}

function formatProgress(progression: number | undefined) {
  return `${Math.round((progression ?? 0) * 100)}%`;
}

function formatPaymentSummary(payment: AdminRentalItem['payment']) {
  if (!payment) return '무료 대여';
  return `${payment.paymentMethod} · ${payment.amount.toLocaleString('ko-KR')}원 (${formatDate(payment.paidAt)})`;
}

function toApiPage(uiPage: number) {
  return Math.max(uiPage - 1, 0);
}

function toUiPage(apiPage: number | undefined) {
  return (apiPage ?? 0) + 1;
}

export function AdminRentalListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rentalsPage, setRentalsPage] = useState<AdminRentalPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [detailRental, setDetailRental] = useState<AdminRentalItem | null>(null);

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const query = useMemo(
    () => ({
      q: searchParams.get('q') || undefined,
      memberId: searchParams.get('memberId') ? Number(searchParams.get('memberId')) : undefined,
      status: (searchParams.get('status') as AdminRentalStatus | null) || undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    }),
    [currentPage, searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadRentals() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminRentals(query);
        if (!ignore) setRentalsPage(data);
      } catch (error) {
        if (!ignore) {
          setRentalsPage(null);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadRentals();

    return () => {
      ignore = true;
    };
  }, [query]);

  function updateQuery(nextValues: Record<string, string>) {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    setSearchParams(nextParams);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateQuery({
      q: String(formData.get('q') ?? '').trim(),
      memberId: String(formData.get('memberId') ?? '').trim(),
      status: String(formData.get('status') ?? ''),
      page: '1',
    });
  }

  const rentals = rentalsPage?.content ?? [];
  const shownPage = toUiPage(rentalsPage?.page);
  const totalPages = rentalsPage?.totalPages ?? 1;

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-rentals-title">
      <div className={styles.header}>
        <div>
          <span>대여</span>
          <h1 id="admin-rentals-title">대여 현황 관리</h1>
        </div>
      </div>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <label>
          <span className={styles.filterLabelText}>검색어</span>
          <input name="q" type="search" placeholder="회원명 · 도서명" defaultValue={searchParams.get('q') ?? ''} />
        </label>
        <label>
          <span className={styles.filterLabelText}>회원 ID</span>
          <input name="memberId" type="number" placeholder="숫자" defaultValue={searchParams.get('memberId') ?? ''} />
        </label>
        <label>
          <span className={styles.filterLabelText}>상태</span>
          <select name="status" defaultValue={searchParams.get('status') ?? ''}>
            <option value="">전체</option>
            {statusOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.filterActions}>
          <Button type="submit">검색</Button>
          <Button type="button" variant="secondary" onClick={() => setSearchParams({})}>
            초기화
          </Button>
        </div>
      </form>

      {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}

      <section className={styles.tablePanel} aria-label="대여 목록">
        <div className={styles.tableHeader}>
          <div>
            <h2>대여 목록</h2>
            <p>총 {(rentalsPage?.totalElements ?? 0).toLocaleString('ko-KR')}건</p>
          </div>
          <span>
            {shownPage} / {totalPages}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>대여번호</th>
                <th>회원</th>
                <th>도서</th>
                <th>상태</th>
                <th>생성일/첫 읽기/종료일</th>
                <th>진행률</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7}>대여 목록을 불러오는 중입니다.</td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={7}>대여 목록을 불러오지 못했습니다.</td>
                </tr>
              ) : rentals.length > 0 ? (
                rentals.map((rental) => (
                  <tr key={rental.rentalId}>
                    <td>R-{rental.rentalId}</td>
                    <td>
                      <Link className={styles.cellLink} to={`/admin/members/${rental.memberId}`}>
                        {rental.memberName}
                      </Link>
                    </td>
                    <td>
                      <Link className={styles.cellLink} to={`/admin/books/${rental.bookId}/edit`}>
                        {rental.bookTitle}
                      </Link>
                    </td>
                    <td>
                      <span className={`${styles.pill} ${statusPillClass[rental.rentalStatus]}`}>{getLabel(statusOptions, rental.rentalStatus)}</span>
                    </td>
                    <td>
                      {formatDate(rental.createdAt)}
                      <span className={styles.cellSub}>
                        첫 읽기 {formatDate(rental.rentalStartAt)} · 종료 {formatDate(rental.rentalEndAt)}
                      </span>
                    </td>
                    <td>{formatProgress(rental.progression)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" onClick={() => setDetailRental(rental)}>
                          상세보기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>대여 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <Button type="button" variant="secondary" disabled={shownPage <= 1} onClick={() => updateQuery({ page: String(shownPage - 1) })}>
            이전
          </Button>
          <span>{shownPage} 페이지</span>
          <Button type="button" variant="secondary" disabled={shownPage >= totalPages} onClick={() => updateQuery({ page: String(shownPage + 1) })}>
            다음
          </Button>
        </div>
      </section>

      {detailRental ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setDetailRental(null)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="rental-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="rental-detail-title">대여 상세</h2>
                <p>R-{detailRental.rentalId}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={() => setDetailRental(null)}>
                ×
              </button>
            </div>
            <dl className={styles.detailList}>
              <div>
                <dt>회원</dt>
                <dd>
                  <Link className={styles.cellLink} to={`/admin/members/${detailRental.memberId}`}>
                    {detailRental.memberName}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>도서</dt>
                <dd>
                  <Link className={styles.cellLink} to={`/admin/books/${detailRental.bookId}/edit`}>
                    {detailRental.bookTitle}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>기간</dt>
                <dd>
                  {formatDate(detailRental.createdAt)} 시작 · 첫 읽기 {formatDate(detailRental.rentalStartAt)} · 종료 {formatDate(detailRental.rentalEndAt)}
                </dd>
              </div>
              <div>
                <dt>결제 연결</dt>
                <dd>{formatPaymentSummary(detailRental.payment)} (읽기 전용)</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}
