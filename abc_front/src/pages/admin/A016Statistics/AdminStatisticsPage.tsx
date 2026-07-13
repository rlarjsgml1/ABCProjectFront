// 통계 관리(A016) 화면 — 기간별 운영 KPI, 추이, 환경 지표를 조회한다. 실제 backend에 연동되나 현재 periodType=TOTAL(+ageBand 미지정/ALL)만 지원한다.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStatistics } from '../../../api/adminStatisticApi';
import { getFallbackAdminDashboard } from '../../../api/adminDashboardApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import type { AdminStatisticsAgeBand, AdminStatisticsData, ReadingTrendPoint } from '../../../types/api';
import listStyles from '../../../styles/AdminOpsListPage.module.css';
import styles from '../../../styles/AdminStatisticsPage.module.css';

const ageBandOptions: Array<{ value: AdminStatisticsAgeBand; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: '10S', label: '10대' },
  { value: '20S', label: '20대' },
  { value: '30S', label: '30대' },
  { value: '40S', label: '40대' },
  { value: '50_PLUS', label: '50대+' },
];

const trendLabels = ['1월', '2월', '3월', '4월', '5월', '6월'];

function buildFallbackTrend(seedRental: number, seedPayment: number, seedRead: number): { rental: ReadingTrendPoint[]; payment: ReadingTrendPoint[]; read: ReadingTrendPoint[] } {
  const build = (seed: number) =>
    trendLabels.map((label, index) => ({
      label,
      rentalCount: Math.max(0, Math.round((seed / trendLabels.length) * (index + 1) * 0.9)),
      readBookCount: 0,
      readPageCount: 0,
    }));

  return { rental: build(seedRental), payment: build(seedPayment), read: build(seedRead) };
}

function sparklinePoints(trend: ReadingTrendPoint[], width = 220, height = 90) {
  if (trend.length === 0) return '';
  const values = trend.map((point) => point.rentalCount);
  const max = Math.max(...values, 1);
  const step = width / Math.max(trend.length - 1, 1);

  return values.map((value, index) => `${index * step},${height - (value / max) * (height - 12) - 4}`).join(' ');
}

export function AdminStatisticsPage() {
  const navigate = useNavigate();
  const [ageBand, setAgeBand] = useState<AdminStatisticsAgeBand>('ALL');
  const [data, setData] = useState<AdminStatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadStatistics() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await getAdminStatistics({ periodType: 'TOTAL', ageBand });
        if (!ignore) setData(result);
      } catch (error) {
        if (!ignore) {
          const fallback = getFallbackAdminDashboard();
          setData({ periodType: 'TOTAL', ageBand, statistics: fallback.statistics, trendPoints: [] });
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 통계를 표시합니다.`);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadStatistics();
    return () => {
      ignore = true;
    };
  }, [ageBand]);

  const trends = useMemo(() => {
    if (!data) return null;
    return buildFallbackTrend(data.statistics.totalRentalCount, data.statistics.totalPaymentAmount / 1000, data.statistics.totalReadBookCount);
  }, [data]);

  const kpiCards = data
    ? [
        { label: '전체 회원', value: data.statistics.totalMemberCount, to: '/admin/members' },
        { label: '제재 회원', value: data.statistics.sanctionedMemberCount, to: '/admin/members?status=SANCTIONED' },
        { label: '이용 가능 도서', value: data.statistics.activeBookCount, to: '/admin/books?status=AVAILABLE' },
        { label: '전체 대여', value: data.statistics.totalRentalCount, to: '/admin/rentals' },
        { label: '완독', value: data.statistics.totalReadBookCount, to: '/admin/rentals?status=OWNED' },
        { label: '결제 합계', value: `${data.statistics.totalPaymentAmount.toLocaleString('ko-KR')}P`, to: '/admin/payments' },
        { label: '리뷰', value: data.statistics.reviewCount, to: '/admin/reports?targetType=REVIEW' },
        { label: '신고', value: data.statistics.reportCount, to: '/admin/reports' },
      ]
    : [];

  return (
    <section className={`page-section ${listStyles.page}`} aria-labelledby="admin-statistics-title">
      <div className={listStyles.header}>
        <div>
          <span>통계</span>
          <h1 id="admin-statistics-title">통계 관리</h1>
        </div>
        <div className={listStyles.apiStrip}>
          <span className={`${listStyles.apiPill} ${listStyles.apiPillLive}`}>GET /admin/statistics · 실제 연동, periodType=TOTAL만 지원 (그 외 404)</span>
        </div>
      </div>

      <div className={styles.filterPanel}>
        <label>
          <span>기간</span>
          <select defaultValue="TOTAL" disabled>
            <option value="TOTAL">전체 (TOTAL)</option>
          </select>
        </label>
        <label>
          <span>나이대</span>
          <select value={ageBand} onChange={(event) => setAgeBand(event.target.value as AdminStatisticsAgeBand)}>
            {ageBandOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {errorMessage ? <p className={listStyles.notice}>{errorMessage}</p> : null}

      {isLoading || !data ? (
        <p className={listStyles.notice}>통계를 불러오는 중입니다.</p>
      ) : (
        <>
          <div className={styles.kpiGrid}>
            {kpiCards.map((card) => (
              <button type="button" key={card.label} className={styles.kpiCard} onClick={() => navigate(card.to)} style={{ textAlign: 'left', border: 'none' }}>
                <div className={styles.kpiLabel}>{card.label}</div>
                <div className={styles.kpiValue}>{typeof card.value === 'number' ? card.value.toLocaleString('ko-KR') : card.value}</div>
              </button>
            ))}
          </div>

          <div className={styles.ecoRow}>
            <div className={styles.ecoCard}>
              <div className={styles.ecoValue}>{data.statistics.carbonSavedKg.toLocaleString('ko-KR')} kg</div>
              <div className={styles.ecoLabel}>탄소 절약량 (완독 수 × 2kg)</div>
            </div>
            <div className={styles.ecoCard}>
              <div className={styles.ecoValue}>{data.statistics.treeSavedCount.toLocaleString('ko-KR')} 그루</div>
              <div className={styles.ecoLabel}>나무 보호량 (완독 수 × 0.04그루)</div>
            </div>
          </div>

          <div className={styles.chartGrid}>
            <div className={styles.chartCard}>
              <h3>대여 추이</h3>
              <svg viewBox="0 0 220 90" width="100%" height="90">
                <polyline points={trends ? sparklinePoints(trends.rental) : ''} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />
              </svg>
            </div>
            <div className={styles.chartCard}>
              <h3>결제 추이</h3>
              <svg viewBox="0 0 220 90" width="100%" height="90">
                <polyline points={trends ? sparklinePoints(trends.payment) : ''} fill="none" stroke="var(--color-success)" strokeWidth="2.5" />
              </svg>
            </div>
            <div className={styles.chartCard}>
              <h3>완독 추이</h3>
              <svg viewBox="0 0 220 90" width="100%" height="90">
                <polyline points={trends ? sparklinePoints(trends.read) : ''} fill="none" stroke="var(--color-warning)" strokeWidth="2.5" />
              </svg>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
