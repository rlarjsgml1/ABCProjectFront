import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBookDetail } from '../../../api/bookApi';
import { getMyCoupons, getMyPoints } from '../../../api/pointsCouponsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import type { BookDetail } from '../../../types/book';
import type { CouponHistoryItem, CouponHistoryPage, PointHistoryPage } from '../../../types/api';
import styles from '../../../styles/RentPaymentPage.module.css';

type RentBookDetail = BookDetail & {
  rentalPrice?: number;
  price?: number;
  rentalPeriodDays?: number;
  defaultRentalDays?: number;
};

function formatWon(value: number | undefined) {
  if (typeof value !== 'number') {
    return '-';
  }

  return `${value.toLocaleString('ko-KR')}원`;
}

function isUsableCoupon(coupon: CouponHistoryItem) {
  return coupon.status === 'ISSUED' || coupon.status === 'AVAILABLE';
}

function getCouponName(coupon: CouponHistoryItem) {
  return coupon.couponName ?? coupon.name ?? coupon.detail ?? coupon.description ?? '-';
}

export function RentPaymentPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<RentBookDetail | null>(null);
  const [pointsPage, setPointsPage] = useState<PointHistoryPage | null>(null);
  const [couponsPage, setCouponsPage] = useState<CouponHistoryPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [pointInput, setPointInput] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadRentPaymentData() {
      if (!bookId) {
        setErrorMessage('도서 ID가 없습니다.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const [bookDetail, points, coupons] = await Promise.all([
          getBookDetail(Number(bookId)),
          getMyPoints({ page: 0, size: 1 }),
          getMyCoupons({ status: 'ISSUED', page: 0, size: 20 }),
        ]);

        if (!ignore) {
          setBook(bookDetail);
          setPointsPage(points);
          setCouponsPage(coupons);
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

    void loadRentPaymentData();

    return () => {
      ignore = true;
    };
  }, [bookId]);

  const rentalPrice = book?.rentalPrice ?? book?.price;
  const rentalDays = book?.rentalPeriodDays ?? book?.defaultRentalDays;
  const isFreeBook = book?.rentalType === 'FREE';
  const pointBalance = pointsPage?.currentPoint ?? pointsPage?.balance ?? pointsPage?.totalPoint;
  const usableCoupons = useMemo(() => (couponsPage?.content ?? []).filter(isUsableCoupon), [couponsPage]);

  function handleCancel() {
    navigate(`/books/${bookId}`);
  }

  function handleApplyCoupon() {
    if (!selectedCouponId) {
      setActionMessage('사용할 쿠폰을 선택해 주세요.');
      return;
    }

    setActionMessage('쿠폰 적용 API 연결 후 계산됩니다.');
  }

  function handleUsePoint() {
    if (!pointInput) {
      setActionMessage('사용할 포인트를 입력해 주세요.');
      return;
    }

    setActionMessage('포인트 사용 API 연결 후 계산됩니다.');
  }

  function handleConfirmRental() {
    setActionMessage(isFreeBook ? '무료 대여 API 연결 후 처리됩니다.' : '결제 API 연결 후 처리됩니다.');
  }

  return (
    <section className={`page-section ${styles.page}`}>
      <p className="eyebrow">U-009</p>

      <div className={styles.header}>
        <div>
          <h1>대여/결제 확인</h1>
          <p>대여 전 도서 정보와 결제 내용을 확인합니다.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={handleCancel}>
          결제 취소
        </button>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.layout}>
        <section className={styles.bookPanel} aria-labelledby="rent-book-title">
          <div className={styles.cover}>
            {book?.coverImageUrl ? <img src={book.coverImageUrl} alt={book.title} /> : <span>표지 영역</span>}
          </div>

          <div className={styles.bookInfo}>
            <h2 id="rent-book-title">{book?.title ?? (isLoading ? '도서 정보를 불러오는 중입니다.' : '도서 정보가 없습니다.')}</h2>
            <dl className={styles.infoList}>
              <div>
                <dt>작가</dt>
                <dd>{book?.author ?? '-'}</dd>
              </div>
              <div>
                <dt>출판사</dt>
                <dd>{book?.publisher ?? '-'}</dd>
              </div>
              <div>
                <dt>대여 유형</dt>
                <dd>{book ? (isFreeBook ? '무료' : '유료') : '-'}</dd>
              </div>
              <div>
                <dt>대여 기간</dt>
                <dd>{typeof rentalDays === 'number' ? `${rentalDays}일` : '-'}</dd>
              </div>
              <div>
                <dt>상태 안내</dt>
                <dd>첫 읽기 전 READY 상태로 내 서재에 표시됩니다.</dd>
              </div>
            </dl>
          </div>
        </section>

        <aside className={styles.summaryPanel} aria-label="대여 결제 요약">
          <h2>결제 요약</h2>
          <dl className={styles.priceList}>
            <div>
              <dt>할인 전 금액</dt>
              <dd>{isFreeBook ? '무료' : formatWon(rentalPrice)}</dd>
            </div>
            <div>
              <dt>쿠폰 할인</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>포인트 차감</dt>
              <dd>-</dd>
            </div>
            <div className={styles.totalRow}>
              <dt>최종 카드 결제 금액</dt>
              <dd>{isFreeBook ? '0원' : formatWon(rentalPrice)}</dd>
            </div>
          </dl>

          <label className={styles.agreement}>
            <input type="checkbox" checked={isAgreed} onChange={(event) => setIsAgreed(event.target.checked)} />
            <span>대여 및 결제 내용을 확인했습니다.</span>
          </label>

          <button className="button button-primary" type="button" onClick={handleConfirmRental} disabled={!book || !isAgreed}>
            {isFreeBook ? '무료 대여 확정' : '결제하기'}
          </button>
          <button className="button button-secondary" type="button" onClick={handleCancel}>
            취소
          </button>

          {actionMessage && <p className={styles.actionMessage}>{actionMessage}</p>}
        </aside>
      </div>

      {!isFreeBook && (
        <section className={styles.paymentPanel} aria-labelledby="payment-option-title">
          <h2 id="payment-option-title">결제 수단 및 할인</h2>

          <div className={styles.optionGrid}>
            <div className={styles.optionCard}>
              <h3>결제수단</h3>
              <p>카드 결제</p>
            </div>

            <div className={styles.optionCard}>
              <div className={styles.optionTitle}>
                <h3>쿠폰</h3>
                <Link to="/me/points-coupons">쿠폰함 보기</Link>
              </div>
              <select value={selectedCouponId} onChange={(event) => setSelectedCouponId(event.target.value)}>
                <option value="">쿠폰을 선택하세요.</option>
                {usableCoupons.map((coupon, index) => (
                  <option value={String(coupon.couponId ?? coupon.id ?? index)} key={coupon.couponId ?? coupon.id ?? index}>
                    {getCouponName(coupon)}
                  </option>
                ))}
              </select>
              <button className="button button-secondary" type="button" onClick={handleApplyCoupon}>
                쿠폰 적용
              </button>
            </div>

            <div className={styles.optionCard}>
              <div className={styles.optionTitle}>
                <h3>포인트</h3>
                <span>보유 {formatWon(pointBalance)}</span>
              </div>
              <input value={pointInput} onChange={(event) => setPointInput(event.target.value)} inputMode="numeric" placeholder="사용할 포인트 입력" />
              <button className="button button-secondary" type="button" onClick={handleUsePoint}>
                포인트 사용
              </button>
            </div>
          </div>
        </section>
      )}

      <section className={styles.policyPanel} aria-labelledby="rent-policy-title">
        <h2 id="rent-policy-title">대여 정책</h2>
        <ul>
          <li>대여 확정 후 내 서재에서 도서를 확인할 수 있습니다.</li>
          <li>첫 읽기 시작 전에는 READY 상태로 표시됩니다.</li>
          <li>결제 완료 전에는 취소하여 도서 상세로 돌아갈 수 있습니다.</li>
        </ul>
      </section>
    </section>
  );
}
