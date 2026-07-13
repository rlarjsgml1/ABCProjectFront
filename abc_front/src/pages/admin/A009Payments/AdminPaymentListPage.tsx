// 결제 관리(A009) 화면 — 완료된 유료 대여 결제와 할인/차감 내역을 조회한다 (환불/취소 UI 없음)
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminPayments } from '../../../api/adminPaymentApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { AdminPaymentItem, AdminPaymentPage } from '../../../types/api';
import styles from '../../../styles/AdminOpsListPage.module.css';

const PAGE_SIZE = 10;

function formatDate(value: string | undefined) {
  if (!value) return '-';
  return value.slice(0, 10);
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString('ko-KR')}P`;
}

const fallbackPayments: AdminPaymentItem[] = [
  {
    paymentId: 5510,
    memberName: '이서연',
    bookTitle: '불편한 편의점',
    rentalId: 8821,
    paymentMethod: '카드',
    grossAmount: 2000,
    couponDiscount: 300,
    couponName: '신규가입 10% 쿠폰',
    pointDiscount: 200,
    amount: 1500,
    paymentStatus: 'PAID',
    paidAt: '2026-07-10',
  },
  {
    paymentId: 5509,
    memberName: '최다인',
    bookTitle: '돈의 심리학',
    rentalId: 8819,
    paymentMethod: '카드',
    grossAmount: 1800,
    couponDiscount: 0,
    pointDiscount: 0,
    amount: 1800,
    paymentStatus: 'PAID',
    paidAt: '2026-07-13',
  },
];

function buildFallbackPaymentPage(query: { q?: string; startDate?: string; endDate?: string; page?: number; size?: number }): AdminPaymentPage {
  const keyword = query.q?.trim().toLowerCase();
  const filtered = fallbackPayments.filter((payment) => {
    const matchesKeyword = keyword ? [payment.memberName, payment.bookTitle].join(' ').toLowerCase().includes(keyword) : true;
    const matchesStart = query.startDate ? payment.paidAt >= query.startDate : true;
    const matchesEnd = query.endDate ? payment.paidAt <= query.endDate : true;

    return matchesKeyword && matchesStart && matchesEnd;
  });

  const page = query.page ?? 0;
  const size = query.size ?? PAGE_SIZE;
  const start = page * size;

  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.max(Math.ceil(filtered.length / size), 1),
    last: start + size >= filtered.length,
  };
}

function toApiPage(uiPage: number) {
  return Math.max(uiPage - 1, 0);
}

function toUiPage(apiPage: number | undefined) {
  return (apiPage ?? 0) + 1;
}

export function AdminPaymentListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentsPage, setPaymentsPage] = useState<AdminPaymentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [dateError, setDateError] = useState('');
  const [detailPayment, setDetailPayment] = useState<AdminPaymentItem | null>(null);

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const query = useMemo(
    () => ({
      q: searchParams.get('q') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    }),
    [currentPage, searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadPayments() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminPayments(query);
        if (!ignore) setPaymentsPage(data);
      } catch (error) {
        if (!ignore) {
          setPaymentsPage(buildFallbackPaymentPage(query));
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 결제 목록을 표시합니다.`);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadPayments();

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
    const startDate = String(formData.get('startDate') ?? '');
    const endDate = String(formData.get('endDate') ?? '');

    if (startDate && endDate && startDate > endDate) {
      setDateError('시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }

    setDateError('');
    updateQuery({ q: String(formData.get('q') ?? '').trim(), startDate, endDate, page: '1' });
  }

  const payments = paymentsPage?.content ?? [];
  const shownPage = toUiPage(paymentsPage?.page);
  const totalPages = paymentsPage?.totalPages ?? 1;

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-payments-title">
      <div className={styles.header}>
        <div>
          <span>결제</span>
          <h1 id="admin-payments-title">결제 관리</h1>
        </div>
        <div className={styles.apiStrip}>
          <span className={styles.apiPill}>GET /admin/payments · controller 미구현 → mock/fallback</span>
        </div>
      </div>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <label>
          <span className={styles.filterLabelText}>검색어</span>
          <input name="q" type="search" placeholder="회원명 · 도서명" defaultValue={searchParams.get('q') ?? ''} />
        </label>
        <label>
          <span className={styles.filterLabelText}>시작일</span>
          <input name="startDate" type="date" defaultValue={searchParams.get('startDate') ?? ''} />
        </label>
        <label>
          <span className={styles.filterLabelText}>종료일</span>
          <input name="endDate" type="date" defaultValue={searchParams.get('endDate') ?? ''} />
        </label>
        <div className={styles.filterActions}>
          <Button type="submit">검색</Button>
          <Button type="button" variant="secondary" onClick={() => setSearchParams({})}>
            초기화
          </Button>
        </div>
      </form>

      {dateError ? <p className={styles.notice}>{dateError}</p> : null}
      {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}

      <section className={styles.tablePanel} aria-label="결제 목록">
        <div className={styles.tableHeader}>
          <div>
            <h2>결제 목록</h2>
            <p>총 {(paymentsPage?.totalElements ?? 0).toLocaleString('ko-KR')}건</p>
          </div>
          <span>
            {shownPage} / {totalPages}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>결제번호</th>
                <th>회원 / 도서</th>
                <th>대여번호</th>
                <th>수단</th>
                <th>금액</th>
                <th>상태</th>
                <th>결제일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>결제 목록을 불러오는 중입니다.</td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>P-{payment.paymentId}</td>
                    <td>
                      {payment.memberName}
                      <span className={styles.cellSub}>{payment.bookTitle}</span>
                    </td>
                    <td>R-{payment.rentalId}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>{formatAmount(payment.amount)}</td>
                    <td>
                      <span className={`${styles.pill} ${styles.pillSuccess}`}>결제 완료</span>
                    </td>
                    <td>{formatDate(payment.paidAt)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" onClick={() => setDetailPayment(payment)}>
                          상세보기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>결제 내역이 없습니다.</td>
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

      {detailPayment ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setDetailPayment(null)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="payment-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="payment-detail-title">결제 상세</h2>
                <p>P-{detailPayment.paymentId}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={() => setDetailPayment(null)}>
                ×
              </button>
            </div>
            <dl className={styles.detailList}>
              <div>
                <dt>할인 전 금액</dt>
                <dd>{formatAmount(detailPayment.grossAmount)}</dd>
              </div>
              <div>
                <dt>쿠폰 할인</dt>
                <dd>{detailPayment.couponDiscount > 0 ? `-${formatAmount(detailPayment.couponDiscount)} (${detailPayment.couponName ?? '쿠폰'})` : '없음'}</dd>
              </div>
              <div>
                <dt>포인트 차감</dt>
                <dd>{detailPayment.pointDiscount > 0 ? `-${formatAmount(detailPayment.pointDiscount)}` : '없음'}</dd>
              </div>
              <div>
                <dt>최종 결제 금액</dt>
                <dd>
                  {formatAmount(detailPayment.amount)} ({detailPayment.paymentMethod})
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}
