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

  const payment = state ?? {
    paymentNumber: 'PAY-TEST-0000',
    paymentType: '카드 결제',
    bookTitle: '대여/결제 테스트 도서',
    saleAmount: 4500,
    usedPointAmount: 0,
    usedCouponName: '-',
    couponDiscountAmount: 0,
    finalPaymentAmount: 4500,
  };

  return (
    <section className="page-section">
      <p className="eyebrow">U-030</p>
      <h1>결제가 완료되었습니다.</h1>
      <p>대여한 도서는 내 서재에서 바로 확인할 수 있습니다.</p>

      <dl>
        <div>
          <dt>결제번호</dt>
          <dd>{payment.paymentNumber}</dd>
        </div>
        <div>
          <dt>결제유형</dt>
          <dd>{payment.paymentType}</dd>
        </div>
        <div>
          <dt>도서명</dt>
          <dd>{payment.bookTitle}</dd>
        </div>
        <div>
          <dt>판매금액</dt>
          <dd>{formatWon(payment.saleAmount)}</dd>
        </div>
        <div>
          <dt>사용포인트</dt>
          <dd>{formatWon(payment.usedPointAmount)}</dd>
        </div>
        <div>
          <dt>사용쿠폰</dt>
          <dd>{payment.usedCouponName}</dd>
        </div>
        <div>
          <dt>할인금액</dt>
          <dd>{formatWon(payment.couponDiscountAmount + payment.usedPointAmount)}</dd>
        </div>
        <div>
          <dt>결제금액</dt>
          <dd>{formatWon(payment.finalPaymentAmount)}</dd>
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
