import { useEffect, useMemo, useState } from 'react';
import { getMyCoupons, getMyPoints } from '../../../api/pointsCouponsApi';
import { getApiErrorMessage, getMyProfile } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { CouponHistoryItem, CouponHistoryPage, PointHistoryItem, PointHistoryPage, UserProfile } from '../../../types/api';

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

function getPointDetail(item: PointHistoryItem) {
  return item.detailContent ?? item.detail ?? item.description ?? '-';
}

function getPointDate(item: PointHistoryItem) {
  return item.earnedAt ?? item.createdAt;
}

function getPointAmount(item: PointHistoryItem) {
  return item.amount ?? item.pointAmount ?? 0;
}

function getPointTypeLabel(value: string | undefined) {
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

  return value ?? '-';
}

function getUsageTypeLabel(item: PointHistoryItem) {
  const value = item.usageType ?? item.useType;
  if (value === 'SAVE') {
    return '적립';
  }

  if (value === 'SPEND') {
    return '차감';
  }

  if (item.pointType === 'PAYMENT_USE' || getPointAmount(item) < 0) {
    return '사용';
  }

  return '적립';
}

function getCouponName(item: CouponHistoryItem) {
  return item.couponName ?? item.name ?? item.detail ?? item.description ?? '-';
}

function getCouponIssuedDate(item: CouponHistoryItem) {
  return item.issuedAt ?? item.createdAt;
}

function getCouponValidUntil(item: CouponHistoryItem) {
  return item.validUntil ?? item.expiredAt;
}

function getCouponStatusLabel(value: string | undefined) {
  if (value === 'ISSUED') {
    return '사용 가능';
  }

  if (value === 'USED') {
    return '사용 완료';
  }

  if (value === 'EXPIRED') {
    return '기간 만료';
  }

  return value ?? '-';
}

function isCouponUsable(value: string | undefined) {
  return value === 'ISSUED';
}

function getPointRowKey(item: PointHistoryItem, index: number) {
  return item.pointHistoryId ?? item.pointId ?? item.id ?? `point-${index}`;
}

function getCouponRowKey(item: CouponHistoryItem, index: number) {
  return item.couponId ?? item.id ?? `coupon-${index}`;
}

function getCouponSortValue(value: string): CouponSort {
  return value === 'EXPIRING_SOON' ? 'EXPIRING_SOON' : 'RECENT_ISSUED';
}

function getAvailableCouponCount(couponsPage: CouponHistoryPage | null, profile: UserProfile | null) {
  if (typeof couponsPage?.availableCouponCount === 'number') {
    return couponsPage.availableCouponCount;
  }

  if (couponsPage) {
    return couponsPage.content.filter((coupon) => isCouponUsable(coupon.status)).length;
  }

  return profile?.couponCount ?? 0;
}

function getExpiringThisMonthCount(couponsPage: CouponHistoryPage | null) {
  if (typeof couponsPage?.expiringThisMonthCount === 'number') {
    return couponsPage.expiringThisMonthCount;
  }

  if (!couponsPage) {
    return 0;
  }

  const now = new Date();
  return couponsPage.content.filter((coupon) => {
    const validUntil = getCouponValidUntil(coupon);
    const time = getDateValue(validUntil);
    if (!time) {
      return false;
    }

    const date = new Date(time);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;
}

export function PointsCouponsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('points');
  const [pointType, setPointType] = useState('');
  const [pointsPage, setPointsPage] = useState<PointHistoryPage | null>(null);
  const [isPointsLoading, setIsPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState('');
  const [couponStatus, setCouponStatus] = useState('ISSUED');
  const [couponSort, setCouponSort] = useState<CouponSort>('RECENT_ISSUED');
  const [couponsPage, setCouponsPage] = useState<CouponHistoryPage | null>(null);
  const [isCouponsLoading, setIsCouponsLoading] = useState(true);
  const [couponsError, setCouponsError] = useState('');

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

    async function loadPoints() {
      setIsPointsLoading(true);
      setPointsError('');

      try {
        const data = await getMyPoints({ pointType: pointType || undefined, page: 0, size: pageSize });
        if (!ignore) {
          setPointsPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setPointsPage(null);
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

  const pointBalance = pointsPage?.currentPoint ?? pointsPage?.balance ?? pointsPage?.totalPoint ?? profile?.point;
  const pointItems = pointsPage?.content ?? [];
  const couponItems = useMemo(() => {
    const items = couponStatus === 'COMPLETED_OR_EXPIRED'
      ? (couponsPage?.content ?? []).filter((coupon) => coupon.status === 'USED' || coupon.status === 'EXPIRED')
      : (couponsPage?.content ?? []);
    return [...items].sort((first, second) => {
      if (couponSort === 'EXPIRING_SOON') {
        return getDateValue(getCouponValidUntil(first)) - getDateValue(getCouponValidUntil(second));
      }

      return getDateValue(getCouponIssuedDate(second)) - getDateValue(getCouponIssuedDate(first));
    });
  }, [couponSort, couponStatus, couponsPage]);
  const availableCouponCount = getAvailableCouponCount(couponsPage, profile);
  const expiringThisMonthCount = getExpiringThisMonthCount(couponsPage);

  return (
    <MyPageLayout profile={profile} isLoading={isProfileLoading} errorMessage={profileError} titleId="points-coupons-title">
      <section className="page-section points-coupons-panel">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">U-017 BENEFITS</p>
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
                    pointItems.map((item, index) => (
                      <tr key={getPointRowKey(item, index)}>
                        <td>{getPointDetail(item)}</td>
                        <td>{formatDate(getPointDate(item))}</td>
                        <td>{getPointTypeLabel(item.pointType)}</td>
                        <td>{getUsageTypeLabel(item)}</td>
                        <td>{formatPoint(getPointAmount(item))}</td>
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
                    couponItems.map((item, index) => (
                      <tr key={getCouponRowKey(item, index)}>
                        <td>{getCouponName(item)}</td>
                        <td>{formatDate(getCouponIssuedDate(item))}</td>
                        <td>{formatDate(getCouponValidUntil(item))}</td>
                        <td>{getCouponStatusLabel(item.status)}</td>
                        <td>
                          <Button
                            className="points-coupons-action"
                            type="button"
                            variant="secondary"
                            disabled={!isCouponUsable(item.status)}
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
