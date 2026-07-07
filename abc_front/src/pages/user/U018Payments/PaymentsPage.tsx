import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyPayments } from '../../../api/paymentsApi';
import { getMyRentals } from '../../../api/myRentalsApi';
import { getApiErrorMessage, getMyProfile } from '../../../api/profileApi';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { PaymentHistoryItem, PaymentHistoryPage, UserProfile } from '../../../types/api';

const pageSize = 10;

type PaymentTypeFilter = 'ALL' | 'FREE' | 'PAID';

const paymentTypeTabs: Array<{ label: string; value: PaymentTypeFilter }> = [
  { label: '전체', value: 'ALL' },
  { label: '무료', value: 'FREE' },
  { label: '유료', value: 'PAID' },
];

function matchesPaymentTypeFilter(payment: PaymentHistoryItem, filter: PaymentTypeFilter) {
  if (filter === 'FREE') {
    return payment.originalAmount === 0;
  }

  if (filter === 'PAID') {
    return payment.originalAmount > 0;
  }

  return true;
}

function formatWon(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

function getPaymentTypeLabel(rentalId: number | undefined, ownedRentalIds: Set<number>) {
  if (rentalId !== undefined && ownedRentalIds.has(rentalId)) {
    return '소장';
  }

  return '대여';
}

function formatDate(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

function getPaymentStatusLabel(status: string) {
  if (status === 'PAID') {
    return '결제 완료';
  }

  return status;
}

export function PaymentsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentsPage, setPaymentsPage] = useState<PaymentHistoryPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null);
  const [ownedRentalIds, setOwnedRentalIds] = useState<Set<number>>(new Set());
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<PaymentTypeFilter>('ALL');

  useEffect(() => {
    let ignore = false;

    async function loadOwnedRentals() {
      try {
        const data = await getMyRentals({ status: 'OWNED', page: 0, size: 100 });
        if (!ignore) {
          setOwnedRentalIds(new Set(data.content.map((item) => item.rentalId)));
        }
      } catch {
        if (!ignore) {
          setOwnedRentalIds(new Set());
        }
      }
    }

    void loadOwnedRentals();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const data = await getMyProfile();
        if (!ignore) {
          setProfile(data);
          setProfileError('');
        }
      } catch (error) {
        if (!ignore) {
          setProfile(null);
          setProfileError(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadPayments() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getMyPayments({
          from: fromDate || undefined,
          to: toDate || undefined,
          page: 0,
          size: pageSize,
        });

        if (!ignore) {
          setPaymentsPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setPaymentsPage(null);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadPayments();

    return () => {
      ignore = true;
    };
  }, [fromDate, toDate]);

  const payments = (paymentsPage?.content ?? []).filter((payment) => matchesPaymentTypeFilter(payment, paymentTypeFilter));

  return (
    <MyPageLayout profile={profile} isLoading={isProfileLoading} errorMessage={profileError} titleId="payments-title">
      <section className="page-section payments-page">
        <div className="section-heading-row">
          <div>
            <h2 id="payments-title">결제 내역</h2>
          </div>
        </div>

        <div className="points-coupons-tabs" role="tablist" aria-label="결제 유형 필터">
          {paymentTypeTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              className={`points-coupons-tab${paymentTypeFilter === tab.value ? ' is-active' : ''}`}
              aria-selected={paymentTypeFilter === tab.value}
              onClick={() => setPaymentTypeFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="payments-toolbar">
          <label>
            <span>시작일</span>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label>
            <span>종료일</span>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
        </div>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

        <div className="points-coupons-table-wrap">
          <table className="points-coupons-table">
            <thead>
              <tr>
                <th scope="col">결제번호</th>
                <th scope="col">도서명</th>
                <th scope="col">금액</th>
                <th scope="col">결제 유형</th>
                <th scope="col">결제일</th>
                <th scope="col">상태</th>
                <th scope="col">상세보기</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7}>결제 내역을 불러오는 중입니다.</td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>{payment.paymentId}</td>
                    <td>
                      {payment.bookId ? (
                        <Link to={`/books/${payment.bookId}`}>{payment.title}</Link>
                      ) : (
                        payment.title
                      )}
                    </td>
                    <td>{formatWon(payment.amount)}</td>
                    <td>{getPaymentTypeLabel(payment.rentalId, ownedRentalIds)}</td>
                    <td>{formatDate(payment.paidAt)}</td>
                    <td>{getPaymentStatusLabel(payment.paymentStatus)}</td>
                    <td>
                      <button type="button" className="button button-secondary" onClick={() => setSelectedPayment(payment)}>
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>결제 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedPayment ? (
        <div className="membership-modal-backdrop" onClick={() => setSelectedPayment(null)}>
          <section
            className="membership-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="membership-modal-header">
              <div>
                <p className="eyebrow">PAYMENT DETAIL</p>
                <h2 id="payment-detail-title">결제 내역 상세보기</h2>
              </div>
              <button
                className="membership-modal-close"
                type="button"
                aria-label="결제 상세 닫기"
                onClick={() => setSelectedPayment(null)}
              >
                ×
              </button>
            </div>

            <div className="membership-modal-body">
              <p>결제번호 {selectedPayment.paymentId}</p>
              <p>결제일자 {formatDate(selectedPayment.paidAt)}</p>
              <p>도서명 {selectedPayment.title}</p>
              <p>결제 유형 {getPaymentTypeLabel(selectedPayment.rentalId, ownedRentalIds)}</p>

              <div className="payment-detail-breakdown">
                <p className="eyebrow">결제 내역</p>
                <p>판매 금액 {formatWon(selectedPayment.originalAmount)}</p>
                <p>사용 포인트 {formatWon(selectedPayment.pointUsedAmount)}</p>
                <p>할인 금액 {formatWon(selectedPayment.couponDiscountAmount)}</p>
                <p>결제 금액 {formatWon(selectedPayment.amount)}</p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </MyPageLayout>
  );
}
