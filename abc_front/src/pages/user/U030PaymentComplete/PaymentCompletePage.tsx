import { Link, useLocation, useParams } from 'react-router-dom';
import styles from '../../../styles/PaymentCompletePage.module.css';

type PaymentCompleteState = {
  paymentNumber: string;
  rentalId?: number;
  paymentType: string;
  bookTitle: string;
  saleAmount: number;
  usedPointAmount: number;
  usedCouponName: string;
  couponDiscountAmount: number;
  finalPaymentAmount: number;
};

function formatWon(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

function formatPaymentValue(value: string | number) {
  if (typeof value === 'number') {
    return formatWon(value);
  }

  return value || '-';
}

export function PaymentCompletePage() {
  const { bookId } = useParams();
  const location = useLocation();
  const state = location.state as PaymentCompleteState | null;
  const totalDiscountAmount = state ? state.couponDiscountAmount + state.usedPointAmount : 0;
  const detailRows = state
    ? [
        { label: '판매 금액', value: state.saleAmount },
        { label: '사용 포인트', value: state.usedPointAmount },
        { label: '사용 쿠폰', value: state.usedCouponName || '-' },
        { label: '할인 금액', value: totalDiscountAmount },
        { label: '결제 금액', value: state.finalPaymentAmount, strong: true },
      ]
    : [];

  if (!state) {
    return (
      <section className={`page-section ${styles.page}`}>
        <div className={styles.emptyState}>
          <p className="eyebrow">U-030</p>
          <h1>결제 완료 정보를 확인할 수 없습니다.</h1>
          <p>결제 완료된 도서만 이 화면에서 확인할 수 있습니다.</p>

          <div className={styles.emptyActions}>
            <Link className="button button-primary" to={`/books/${bookId}/rent`}>
              대여/결제 화면으로 이동
            </Link>
            <Link className="button button-secondary" to={`/books/${bookId}`}>
              도서 상세로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`page-section ${styles.page}`}>
      <header className={styles.header}>
        <p className="eyebrow">U-030</p>
        <h1>결제 완료</h1>
        <p>다음과 같이 결제가 완료되었습니다. 감사합니다.</p>
      </header>

      <div className={styles.completeCard}>
        <section className={styles.orderSummary} aria-labelledby="payment-summary-title">
          <h2 id="payment-summary-title">결제 정보</h2>
          <dl>
            <div>
              <dt>결제번호</dt>
              <dd>{state.paymentNumber}</dd>
            </div>
            <div>
              <dt>결제 유형</dt>
              <dd>{state.paymentType}</dd>
            </div>
            <div>
              <dt>도서명</dt>
              <dd>{state.bookTitle}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.amountPanel} aria-labelledby="payment-amount-title">
          <h2 id="payment-amount-title">결제 금액</h2>
          <dl>
            {detailRows.map((row) => (
              <div className={row.strong ? styles.totalRow : undefined} key={row.label}>
                <dt>{row.label}</dt>
                <dd>{formatPaymentValue(row.value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.confirmPanel} aria-labelledby="rental-confirm-title">
          <h2 id="rental-confirm-title">대여 완료 정보</h2>
          <dl>
            <div>
              <dt>결제번호</dt>
              <dd>{state.paymentNumber}</dd>
            </div>
            <div>
              <dt>결제 유형</dt>
              <dd>{state.paymentType}</dd>
            </div>
            <div>
              <dt>도서명</dt>
              <dd>{state.bookTitle}</dd>
            </div>
          </dl>
        </section>

        <p className={styles.notice}>결제 완료된 도서는 내 서재에 반영되며, 전자책 뷰어에서 바로 이용할 수 있습니다.</p>

        <nav className={styles.actions} aria-label="결제 완료 후 이동">
          <Link className="button button-primary" to="/me">
            내 서재 가기
          </Link>
          <Link className="button button-secondary" to="/me/payments">
            결제 내역 가기
          </Link>
          {state.rentalId ? (
            <Link className="button button-secondary" to={`/viewer/${state.rentalId}`}>
              뷰어 보기
            </Link>
          ) : (
            <button className="button button-secondary" type="button" disabled>
              뷰어 보기
            </button>
          )}
          <Link className="button button-secondary" to={`/books/${bookId}`}>
            이전으로
          </Link>
        </nav>
      </div>
    </section>
  );
}
