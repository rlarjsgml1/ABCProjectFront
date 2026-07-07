import { Link, useLocation, useParams } from 'react-router-dom';

type PaymentCompleteState = {
  paymentNumber: string;
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

export function PaymentCompletePage() {
  const { bookId } = useParams();
  const location = useLocation();
  const state = location.state as PaymentCompleteState | null;

  if (!state) {
    return (
      <section className="page-section">
        <p className="eyebrow">U-030</p>
        <h1>결제 완료 정보를 확인할 수 없습니다.</h1>
        <p>대여/결제 화면에서 결제를 완료한 후 다시 확인해 주세요.</p>

        <div>
          <Link className="button button-primary" to={`/books/${bookId}/rent`}>
            대여/결제 화면으로 이동
          </Link>
          <Link className="button button-secondary" to={`/books/${bookId}`}>
            도서 상세로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <p className="eyebrow">U-030</p>
      <h1>결제가 완료되었습니다.</h1>
      <p>대여한 도서는 내 서재에서 바로 확인할 수 있습니다.</p>

      <dl>
        <div>
          <dt>결제번호</dt>
          <dd>{state.paymentNumber}</dd>
        </div>
        <div>
          <dt>결제유형</dt>
          <dd>{state.paymentType}</dd>
        </div>
        <div>
          <dt>도서명</dt>
          <dd>{state.bookTitle}</dd>
        </div>
        <div>
          <dt>판매금액</dt>
          <dd>{formatWon(state.saleAmount)}</dd>
        </div>
        <div>
          <dt>사용포인트</dt>
          <dd>{formatWon(state.usedPointAmount)}</dd>
        </div>
        <div>
          <dt>사용쿠폰</dt>
          <dd>{state.usedCouponName}</dd>
        </div>
        <div>
          <dt>할인금액</dt>
          <dd>{formatWon(state.couponDiscountAmount + state.usedPointAmount)}</dd>
        </div>
        <div>
          <dt>결제금액</dt>
          <dd>{formatWon(state.finalPaymentAmount)}</dd>
        </div>
      </dl>

      <div>
        <Link className="button button-primary" to="/me/rentals">
          내 서재로 이동
        </Link>
        <Link className="button button-secondary" to={`/books/${bookId}`}>
          도서 상세로 돌아가기
        </Link>
      </div>
    </section>
  );
}
