import { useEffect, useMemo, useState } from 'react';
import { getMyCoupons, getMyPoints } from '../../../api/pointsCouponsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import { useMyProfile } from '../../../context/MyProfileContext';
import type { CouponHistoryItem, CouponHistoryPage, CouponStatus, PointHistoryItem, PointSummary } from '../../../types/api';

type ActiveTab = 'points' | 'coupons';
type CouponSort = 'RECENT_ISSUED' | 'EXPIRING_SOON';

const pageSize = 10;

const pointTypeOptions = [
  { label: '전체', value: '' },
  { label: '챌린지 보상', value: 'CHALLENGE_REWARD' },
  { label: '리뷰 보상', value: 'REVIEW_REWARD' },
  { label: '결제 페이백', value: 'PAYBACK' },
  { label: '이벤트 보상', value: 'EVENT_REWARD' },
  { label: '결제 사용', value: 'PAYMENT_USE' },
  { label: '관리자 조정', value: 'ADMIN_ADJUST' },
];

const couponStatusOptions = [
  { label: '사용 가능', value: 'ISSUED' },
  { label: '사용 완료/기간 만료', value: 'COMPLETED_OR_EXPIRED' },
];

const couponSortOptions: Array<{ label: string; value: CouponSort }> = [
  { label: '최근 발행 순', value: 'RECENT_ISSUED' },
  { label: '유효기간 임박 순', value: 'EXPIRING_SOON' },
];

function formatPoint(value: number | undefined) {
  return `${(value ?? 0).toLocaleString('ko-KR')}p`;
}

function formatCount(value: number | undefined) {
  return `${value ?? 0}장`;
}

function getDateValue(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatDate(value: string | undefined) {
  if (!value) {
    return '-';
  }

  const time = getDateValue(value);
  if (!time) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

function getPointTypeLabel(value: string) {
  if (value === 'CHALLENGE_REWARD') {
    return '챌린지 보상';
  }

  if (value === 'REVIEW_REWARD') {
    return '리뷰 보상';
  }

  if (value === 'PAYBACK') {
    return '결제 페이백';
  }

  if (value === 'EVENT_REWARD') {
    return '이벤트 보상';
  }

  if (value === 'PAYMENT_USE') {
    return '결제 사용';
  }

  if (value === 'ADMIN_ADJUST') {
    return '관리자 조정';
  }

  return value;
}

function getUsageTypeLabel(item: PointHistoryItem) {
  if (item.pointType === 'PAYMENT_USE' || item.pointAmount < 0) {
    return '사용';
  }

  return '적립';
}

function getCouponStatusLabel(value: CouponStatus) {
  if (value === 'ISSUED') {
    return '사용 가능';
  }

  if (value === 'USED') {
    return '사용 완료';
  }

  return '기간 만료';
}

function isCouponUsable(value: CouponStatus) {
  return value === 'ISSUED';
}

function getCouponSortValue(value: string): CouponSort {
  return value === 'EXPIRING_SOON' ? 'EXPIRING_SOON' : 'RECENT_ISSUED';
}

function getAvailableCouponCount(couponsPage: CouponHistoryPage | null, fallback: number | undefined) {
  if (!couponsPage) {
    return fallback ?? 0;
  }

  return couponsPage.content.filter((coupon) => isCouponUsable(coupon.couponStatus)).length;
}

function getExpiringThisMonthCount(couponsPage: CouponHistoryPage | null) {
  if (!couponsPage) {
    return 0;
  }

  const now = new Date();
  return couponsPage.content.filter((coupon) => {
    const time = getDateValue(coupon.expiresAt);
    if (!time) {
      return false;
    }

    const date = new Date(time);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;
}

export function PointsCouponsPage() {
  const { profile } = useMyProfile();
  const [activeTab, setActiveTab] = useState<ActiveTab>('points');
  const [pointType, setPointType] = useState('');
  const [pointSummary, setPointSummary] = useState<PointSummary | null>(null);
  const [isPointsLoading, setIsPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState('');
  const [couponStatus, setCouponStatus] = useState('ISSUED');
  const [couponSort, setCouponSort] = useState<CouponSort>('RECENT_ISSUED');
  const [couponsPage, setCouponsPage] = useState<CouponHistoryPage | null>(null);
  const [isCouponsLoading, setIsCouponsLoading] = useState(true);
  const [couponsError, setCouponsError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadPoints() {
      setIsPointsLoading(true);
      setPointsError('');

      try {
        const data = await getMyPoints({ pointType: pointType || undefined, page: 0, size: pageSize });
        if (!ignore) {
          setPointSummary(data);
        }
      } catch (error) {
        if (!ignore) {
          setPointSummary(null);
          setPointsError(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsPointsLoading(false);
        }
      }
    }

    void loadPoints();

    return () => {
      ignore = true;
    };
  }, [pointType]);

  useEffect(() => {
    let ignore = false;

    async function loadCoupons() {
      setIsCouponsLoading(true);
      setCouponsError('');

      try {
        const data = await getMyCoupons({
          status: couponStatus === 'COMPLETED_OR_EXPIRED' ? undefined : couponStatus,
          page: 0,
          size: pageSize,
        });
        if (!ignore) {
          setCouponsPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setCouponsPage(null);
          setCouponsError(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsCouponsLoading(false);
        }
      }
    }

    void loadCoupons();

    return () => {
      ignore = true;
    };
  }, [couponStatus]);

  const pointBalance = pointSummary?.pointBalance ?? profile?.point;
  const pointItems = pointSummary?.history.content ?? [];
  const couponItems = useMemo(() => {
    const items = couponStatus === 'COMPLETED_OR_EXPIRED'
      ? (couponsPage?.content ?? []).filter((coupon) => coupon.couponStatus === 'USED' || coupon.couponStatus === 'EXPIRED')
      : (couponsPage?.content ?? []);
    return [...items].sort((first, second) => {
      if (couponSort === 'EXPIRING_SOON') {
        return getDateValue(first.expiresAt) - getDateValue(second.expiresAt);
      }

      return getDateValue(second.issuedAt) - getDateValue(first.issuedAt);
    });
  }, [couponSort, couponStatus, couponsPage]);
  const availableCouponCount = getAvailableCouponCount(couponsPage, profile?.couponCount);
  const expiringThisMonthCount = getExpiringThisMonthCount(couponsPage);

  return (
    <MyPageLayout titleId="points-coupons-title">
      <section className="page-section points-coupons-panel">
        <div className="section-heading-row">
          <div>
            <h2 id="points-coupons-title">포인트/쿠폰 내역</h2>
          </div>
          <span>혜택 이용 현황</span>
        </div>

        <div className="points-coupons-tabs" role="tablist" aria-label="포인트 쿠폰 내역 탭">
          <button
            className={`points-coupons-tab${activeTab === 'points' ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'points'}
            aria-controls="points-panel"
            onClick={() => setActiveTab('points')}
          >
            포인트
          </button>
          <button
            className={`points-coupons-tab${activeTab === 'coupons' ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'coupons'}
            aria-controls="coupons-panel"
            onClick={() => setActiveTab('coupons')}
          >
            쿠폰
          </button>
        </div>

        {activeTab === 'points' ? (
          <section className="points-coupons-tab-panel" id="points-panel" role="tabpanel" aria-label="포인트 내역">
            <div className="points-coupons-summary-card points-summary-card">
              <span>보유 포인트</span>
              <strong>{formatPoint(pointBalance)}</strong>
            </div>

            <div className="points-coupons-toolbar">
              <p>*최근 1개월 이용내역 입니다.</p>
              <label>
                <span>포인트 유형</span>
                <select value={pointType} onChange={(event) => setPointType(event.target.value)}>
                  {pointTypeOptions.map((option) => (
                    <option key={option.value || 'ALL'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {pointsError ? <div className="status-banner status-banner-error">{pointsError}</div> : null}

            <div className="points-coupons-table-wrap">
              <table className="points-coupons-table">
                <thead>
                  <tr>
                    <th scope="col">상세내용</th>
                    <th scope="col">적립일</th>
                    <th scope="col">포인트 유형</th>
                    <th scope="col">사용 구분</th>
                    <th scope="col">적립 금액</th>
                  </tr>
                </thead>
                <tbody>
                  {isPointsLoading ? (
                    <tr>
                      <td colSpan={5}>포인트 내역을 불러오는 중입니다.</td>
                    </tr>
                  ) : pointItems.length > 0 ? (
                    pointItems.map((item) => (
                      <tr key={item.pointHistoryId}>
                        <td>{item.description}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>{getPointTypeLabel(item.pointType)}</td>
                        <td>{getUsageTypeLabel(item)}</td>
                        <td>{formatPoint(item.pointAmount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>해당기간에 내역이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="points-coupons-tab-panel" id="coupons-panel" role="tabpanel" aria-label="쿠폰 내역">
            <div className="coupon-summary-grid">
              <div className="points-coupons-summary-card">
                <span>사용 가능한 쿠폰</span>
                <strong>{formatCount(availableCouponCount)}</strong>
              </div>
              <div className="points-coupons-summary-card coupon-expiring-card">
                <span>이번 달 소멸예정 쿠폰</span>
                <strong>{formatCount(expiringThisMonthCount)}</strong>
              </div>
            </div>

            <div className="points-coupons-toolbar">
              <label>
                <span>쿠폰 상태</span>
                <select value={couponStatus} onChange={(event) => setCouponStatus(event.target.value)}>
                  {couponStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>정렬</span>
                <select value={couponSort} onChange={(event) => setCouponSort(getCouponSortValue(event.target.value))}>
                  {couponSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {couponsError ? <div className="status-banner status-banner-error">{couponsError}</div> : null}

            <div className="points-coupons-table-wrap">
              <table className="points-coupons-table">
                <thead>
                  <tr>
                    <th scope="col">상세내용</th>
                    <th scope="col">발행일</th>
                    <th scope="col">유효기간</th>
                    <th scope="col">상태</th>
                    <th scope="col">사용</th>
                  </tr>
                </thead>
                <tbody>
                  {isCouponsLoading ? (
                    <tr>
                      <td colSpan={5}>쿠폰 내역을 불러오는 중입니다.</td>
                    </tr>
                  ) : couponItems.length > 0 ? (
                    couponItems.map((item: CouponHistoryItem) => (
                      <tr key={item.memberCouponId}>
                        <td>{item.couponName}</td>
                        <td>{formatDate(item.issuedAt)}</td>
                        <td>{formatDate(item.expiresAt)}</td>
                        <td>{getCouponStatusLabel(item.couponStatus)}</td>
                        <td>
                          <Button
                            className="points-coupons-action"
                            type="button"
                            variant="secondary"
                            disabled={!isCouponUsable(item.couponStatus)}
                          >
                            사용 가능한 도서 보기
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>조회된 쿠폰이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </MyPageLayout>
  );
}
