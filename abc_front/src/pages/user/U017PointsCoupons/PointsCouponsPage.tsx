// 포인트/쿠폰(U017) 화면 — 보유 포인트·쿠폰 내역을 탭으로 나눠 필터링 및 정렬하여 조회한다
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMyCoupons, getMyPoints } from '../../../api/pointsCouponsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import { Table } from '../../../components/common/Table';
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

function getActiveTab(value: string | null): ActiveTab {
  return value === 'coupons' ? 'coupons' : 'points';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = getActiveTab(searchParams.get('tab'));
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

  const pointBalance = pointSummary?.pointBalance ?? profile?.pointBalance;
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

  function handleTabChange(tab: ActiveTab) {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('tab', tab);
    setSearchParams(nextSearchParams, { replace: true });
  }

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
            onClick={() => handleTabChange('points')}
          >
            포인트
          </button>
          <button
            className={`points-coupons-tab${activeTab === 'coupons' ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === 'coupons'}
            aria-controls="coupons-panel"
            onClick={() => handleTabChange('coupons')}
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

            <Table<PointHistoryItem>
              columns={[
                { key: 'description', header: '상세내용' },
                { key: 'createdAt', header: '적립일', render: (item) => formatDate(item.createdAt) },
                { key: 'pointType', header: '포인트 유형', render: (item) => getPointTypeLabel(item.pointType) },
                { key: 'usage', header: '사용 구분', render: (item) => getUsageTypeLabel(item) },
                { key: 'pointAmount', header: '적립 금액', render: (item) => formatPoint(item.pointAmount) },
              ]}
              rows={pointItems}
              rowKey={(item) => item.pointHistoryId}
              isLoading={isPointsLoading}
              loadingMessage="포인트 내역을 불러오는 중입니다."
              emptyMessage="해당기간에 내역이 없습니다."
            />
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

            <Table<CouponHistoryItem>
              columns={[
                { key: 'couponName', header: '상세내용' },
                { key: 'issuedAt', header: '발행일', render: (item) => formatDate(item.issuedAt) },
                { key: 'expiresAt', header: '유효기간', render: (item) => formatDate(item.expiresAt) },
                { key: 'couponStatus', header: '상태', render: (item) => getCouponStatusLabel(item.couponStatus) },
                {
                  key: 'action',
                  header: '사용',
                  render: (item) => (
                    <Button
                      className="points-coupons-action"
                      type="button"
                      variant="secondary"
                      disabled={!isCouponUsable(item.couponStatus)}
                    >
                      사용 가능한 도서 보기
                    </Button>
                  ),
                },
              ]}
              rows={couponItems}
              rowKey={(item) => item.memberCouponId}
              isLoading={isCouponsLoading}
              loadingMessage="쿠폰 내역을 불러오는 중입니다."
              emptyMessage="조회된 쿠폰이 없습니다."
            />
          </section>
        )}
      </section>
    </MyPageLayout>
  );
}
