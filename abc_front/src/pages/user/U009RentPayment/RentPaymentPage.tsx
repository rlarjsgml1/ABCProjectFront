import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  pageCount?: number;
  categoryName?: string;
  publishedAt?: string;
  fileFormat?: string;
};

const TEMP_RENT_PAYMENT_TEST_PREVIEW = true;

const testPreviewBook: RentBookDetail = {
  bookId: 1,
  title: '대여/결제 테스트 도서',
  author: 'ABC',
  publisher: 'ABC 출판',
  description: 'U-009 대여/결제 화면 테스트용 도서 정보입니다.',
  coverImageUrl: '',
  rentalType: 'PAID',
  status: 'AVAILABLE',
  rentalPrice: 4500,
  rentalPeriodDays: 14,
  pageCount: 328,
  categoryName: '경제 / 경영',
  publishedAt: '2026-07-01',
  fileFormat: 'EPUB',
};

const testPreviewPointsPage: PointHistoryPage = {
  content: [],
  page: 0,
  size: 1,
  totalElements: 0,
  totalPages: 0,
  last: true,
  currentPoint: 12000,
};

const testPreviewCouponsPage: CouponHistoryPage = {
  content: [
    {
      couponId: 1,
      couponName: '테스트용 1,000원 할인 쿠폰',
      status: 'ISSUED',
    },
  ],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  last: true,
  availableCouponCount: 1,
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

function getCouponDiscount(couponId: string) {
  return couponId ? 1000 : 0;
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
  const [appliedCouponId, setAppliedCouponId] = useState('');
  const [appliedPointAmount, setAppliedPointAmount] = useState(0);
  const [pointInput, setPointInput] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [pointMessage, setPointMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');

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

      if (TEMP_RENT_PAYMENT_TEST_PREVIEW) {
        setBook(testPreviewBook);
        setPointsPage(testPreviewPointsPage);
        setCouponsPage(testPreviewCouponsPage);
        setIsLoading(false);
        return;
      }

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
  const basePaymentAmount = isFreeBook ? 0 : rentalPrice ?? 0;
  const couponDiscountAmount = isFreeBook ? 0 : Math.min(getCouponDiscount(appliedCouponId), basePaymentAmount);
  const pointDiscountAmount = isFreeBook ? 0 : Math.min(appliedPointAmount, Math.max(basePaymentAmount - couponDiscountAmount, 0));
  const finalPaymentAmount = Math.max(basePaymentAmount - couponDiscountAmount - pointDiscountAmount, 0);
  const paymentAmountLabel = formatWon(finalPaymentAmount);
  const selectedCouponName = usableCoupons.find((coupon) => String(coupon.couponId ?? coupon.id) === appliedCouponId);

  function handleCancel() {
    navigate(`/books/${bookId}`);
  }

  function handleApplyCoupon() {
    if (!selectedCouponId) {
      setCouponMessage('사용할 쿠폰을 선택해 주세요.');
      return;
    }

    setAppliedCouponId(selectedCouponId);
    setCouponMessage('쿠폰 1,000원이 적용되었습니다.');
  }

  function handleUsePoint() {
    const trimmedPointInput = pointInput.trim();

    if (!trimmedPointInput) {
      setPointMessage('사용할 포인트를 입력해 주세요.');
      return;
    }

    const pointAmount = Number(trimmedPointInput);

    if (!Number.isInteger(pointAmount) || pointAmount < 0) {
      setPointMessage('포인트는 0 이상의 숫자로 입력해 주세요.');
      return;
    }

    if (typeof pointBalance === 'number' && pointAmount > pointBalance) {
      setPointMessage('보유 포인트 이하로 입력해 주세요.');
      return;
    }

    setAppliedPointAmount(pointAmount);
    setPointMessage(`${pointAmount.toLocaleString('ko-KR')}포인트가 적용되었습니다.`);
  }

  function handleConfirmRental() {
    if (!isAgreed) {
      setCheckoutMessage('약관에 동의해 주세요.');
      return;
    }

    navigate(`/books/${bookId}/rent/complete`, {
      state: {
        paymentNumber: `PAY-TEST-${Date.now()}`,
        paymentType: isFreeBook ? '무료 대여' : '카드 결제',
        bookTitle: book?.title ?? '-',
        saleAmount: basePaymentAmount,
        usedPointAmount: pointDiscountAmount,
        usedCouponName: selectedCouponName ? getCouponName(selectedCouponName) : '-',
        couponDiscountAmount,
        finalPaymentAmount,
      },
    });
  }

  return (
    <section className={`page-section ${styles.page}`}>
      <p className="eyebrow">U-009</p>

      <div className={styles.header}>
        <div>
          <h1>대여/결제 확인</h1>
          <p>대여 전 도서 정보와 결제 내용을 확인합니다.</p>
        </div>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={styles.heroLayout}>
        <section className={styles.bookPanel} aria-labelledby="rent-book-title">
          <div className={styles.cover}>
            {book?.coverImageUrl ? <img src={book.coverImageUrl} alt={book.title} /> : <span>표지 영역</span>}
          </div>

          <div className={styles.bookInfo}>
            <h2 id="rent-book-title">{book?.title ?? (isLoading ? '도서 정보를 불러오는 중입니다.' : '도서 정보가 없습니다.')}</h2>
            <p className={styles.bookMeta}>
              {book?.author ?? '-'} | {book?.publisher ?? '-'} | -
            </p>
            <dl className={styles.infoList}>
              <div>
                <dt>파일 형식</dt>
                <dd>{book?.fileFormat ?? '-'}</dd>
              </div>
              <div>
                <dt>페이지 수</dt>
                <dd>{typeof book?.pageCount === 'number' ? `${book.pageCount}쪽` : '-'}</dd>
              </div>
              <div>
                <dt>출간일</dt>
                <dd>{book?.publishedAt ?? '-'}</dd>
              </div>
              <div>
                <dt>카테고리</dt>
                <dd>{book?.categoryName ?? '-'}</dd>
              </div>
              <div>
                <dt>대여 가능 여부</dt>
                <dd>
                  <span className={styles.statusChip}>대여 가능</span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <aside className={styles.summaryPanel} aria-label="대여 결제 요약">
          <div className={styles.summaryTop}>
            <span>대여 기간</span>
            <strong>{typeof rentalDays === 'number' ? `${rentalDays}일` : '-'}</strong>
          </div>
          <dl className={styles.priceList}>
            <div>
              <dt>판매 금액</dt>
              <dd>{isFreeBook ? '0원' : formatWon(rentalPrice)}</dd>
            </div>
            <div>
              <dt>쿠폰 할인</dt>
              <dd>{formatWon(couponDiscountAmount)}</dd>
            </div>
            <div>
              <dt>포인트 차감</dt>
              <dd>{formatWon(pointDiscountAmount)}</dd>
            </div>
            <div className={styles.totalRow}>
              <dt>최종 카드 결제 금액</dt>
              <dd>{paymentAmountLabel}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className={styles.rentalInfoPanel} aria-labelledby="rental-info-title">
        <h2 id="rental-info-title">대여 정보</h2>

        <div className={styles.rentalGrid}>
          <section className={styles.rentalCard}>
            <h3>대여 기간</h3>
            <dl>
              <div>
                <dt>대여 시작 예정일</dt>
                <dd>결제 완료 즉시</dd>
              </div>
              <div>
                <dt>대여 기간</dt>
                <dd>{typeof rentalDays === 'number' ? `${rentalDays}일` : '-'}</dd>
              </div>
              <div>
                <dt>반납 예정일</dt>
                <dd>{typeof rentalDays === 'number' ? `대여 시작일로부터 ${rentalDays}일 후` : '-'}</dd>
              </div>
              <div>
                <dt>무료 대여 여부</dt>
                <dd>{isFreeBook ? '예' : '아니오'}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.rentalCard}>
            <h3>결제 정보</h3>
            <dl>
              <div>
                <dt>결제 수단</dt>
                <dd>카드 결제</dd>
              </div>
              <div className={styles.paymentOptionRow}>
                <dt>쿠폰 할인</dt>
                <dd>
                  <div className={styles.paymentField}>
                    <div className={styles.paymentControl}>
                      <select value={selectedCouponId} onChange={(event) => setSelectedCouponId(event.target.value)}>
                        <option value="">쿠폰 선택</option>
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
                    {couponMessage && <p className={styles.fieldMessage}>{couponMessage}</p>}
                  </div>
                </dd>
              </div>
              <div className={styles.paymentOptionRow}>
                <dt>포인트 사용</dt>
                <dd>
                  <div className={styles.paymentField}>
                    <span className={styles.pointBalance}>보유 {formatWon(pointBalance)}</span>
                    <div className={styles.paymentControl}>
                      <input value={pointInput} onChange={(event) => setPointInput(event.target.value)} inputMode="numeric" placeholder="사용 포인트" />
                      <button className="button button-secondary" type="button" onClick={handleUsePoint}>
                        포인트 사용
                      </button>
                    </div>
                    {pointMessage && <p className={styles.fieldMessage}>{pointMessage}</p>}
                  </div>
                </dd>
              </div>
              <div>
                <dt>최종 결제 금액</dt>
                <dd>{paymentAmountLabel}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.rentalCard}>
            <h3>무료 / 유료 대여 확정</h3>
            <p>대여 확정 후 내 서재에서 바로 확인할 수 있습니다.</p>
          </section>
        </div>
      </section>

      <section className={styles.policyPanel} aria-labelledby="rent-policy-title">
        <h2 id="rent-policy-title">대여 정책</h2>
        <ul>
          <li>대여가 확정되면 내 서재에서 바로 도서를 열람할 수 있습니다.</li>
          <li>대여 기간이 끝나면 도서는 자동 반납되며, 기간 만료 후에는 다시 대여해야 합니다.</li>
          <li>쿠폰과 포인트는 결제 확정 전에만 적용할 수 있으니 최종 결제 금액을 확인해 주세요.</li>
          <li>무료 도서는 결제 없이 대여 확정만으로 이용할 수 있습니다.</li>
        </ul>
      </section>

      {checkoutMessage && <p className={styles.actionMessage}>{checkoutMessage}</p>}

      <section className={styles.checkoutPanel} aria-label="최종 결제">
        <div>
          <span className={styles.checkoutLabel}>최종 결제 금액</span>
          <strong>{paymentAmountLabel}</strong>
        </div>
        <div className={styles.checkoutControl}>
          <label className={styles.agreement}>
            <input type="checkbox" checked={isAgreed} onChange={(event) => setIsAgreed(event.target.checked)} />
            <span>대여 및 결제 내용을 확인했습니다.</span>
          </label>
          <div className={styles.checkoutActions}>
            <button className="button button-primary" type="button" onClick={handleConfirmRental} disabled={!book}>
              {isFreeBook ? '무료 대여 확정' : '결제하기'}
            </button>
            <button className="button button-secondary" type="button" onClick={handleCancel}>
              취소
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
