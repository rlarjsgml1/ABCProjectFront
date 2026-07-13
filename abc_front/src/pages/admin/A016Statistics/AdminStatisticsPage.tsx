// 통계 관리(A016) 화면 — 기간별 운영 KPI, 추이, 환경 지표를 조회한다. 실제 backend에 연동되나 현재 periodType=TOTAL(+ageBand 미지정/ALL)만 지원한다.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { getAdminStatistics } from '../../../api/adminStatisticApi';
import { getFallbackAdminDashboard } from '../../../api/adminDashboardApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import type { AdminStatisticsAgeBand, AdminStatisticsData } from '../../../types/api';
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

type ChartPoint = { label: string; value: number };

const trendLabels = ['1월', '2월', '3월', '4월', '5월', '6월'];

// 결제 추이는 ReadingTrendPoint에 금액 필드가 없어 결제 합계를 균등 배분해 근사한다. (API gap)
function estimateSeries(seed: number): ChartPoint[] {
  return trendLabels.map((label, index) => ({
    label,
    value: Math.max(0, Math.round((seed / trendLabels.length) * (index + 1) * 0.9)),
  }));
}

function formatNumber(value: number) {
  return value.toLocaleString('ko-KR');
}

// Y축 눈금은 자리수가 큰 결제 금액도 겹치지 않도록 만 단위로 축약한다.
function formatCompact(value: number) {
  if (Math.abs(value) >= 10000) return `${Math.round(value / 10000).toLocaleString('ko-KR')}만`;
  return value.toLocaleString('ko-KR');
}

function TrendTooltip({ active, label, payload, unit }: TooltipContentProps & { unit: string }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>{label}</p>
      <p className={styles.chartTooltipValue}>
        {formatNumber(Number(payload[0]?.value ?? 0))}
        {unit}
      </p>
    </div>
  );
}

function TrendChart({ title, points, color, unit }: { title: string; points: ChartPoint[]; color: string; unit: string }) {
  return (
    <div className={styles.chartCard}>
      <h3>{title}</h3>
      <div className={styles.chartArea} role="img" aria-label={`${title} 그래프`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 8" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} tickMargin={8} />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
              tickFormatter={(value: number) => formatCompact(value)}
            />
            <Tooltip content={(tooltipProps: TooltipContentProps) => <TrendTooltip {...tooltipProps} unit={unit} />} cursor={{ stroke: color, strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} name={title} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AdminStatisticsPage() {
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

    const realTrend = data.trendPoints ?? [];
    const rental: ChartPoint[] = realTrend.length > 0 ? realTrend.map((point) => ({ label: point.label, value: point.rentalCount })) : estimateSeries(data.statistics.totalRentalCount);
    const read: ChartPoint[] = realTrend.length > 0 ? realTrend.map((point) => ({ label: point.label, value: point.readBookCount })) : estimateSeries(data.statistics.totalReadBookCount);
    // 결제 추이는 real trendPoints에도 금액 필드가 없어 항상 근사치를 사용한다.
    const payment = estimateSeries(data.statistics.totalPaymentAmount);

    return { rental, read, payment };
  }, [data]);

  const kpiCards = data
    ? [
        {
          label: '전체 회원',
          value: data.statistics.totalMemberCount.toLocaleString('ko-KR'),
          caption: `제재 회원 ${data.statistics.sanctionedMemberCount.toLocaleString('ko-KR')}명`,
          tone: 'info' as const,
          to: '/admin/members',
        },
        {
          label: '제재 회원',
          value: data.statistics.sanctionedMemberCount.toLocaleString('ko-KR'),
          caption: '현재 유효 제재 기준',
          tone: 'danger' as const,
          to: '/admin/members?status=SANCTIONED',
        },
        {
          label: '이용 가능 도서',
          value: data.statistics.activeBookCount.toLocaleString('ko-KR'),
          caption: '숨김/비활성 제외',
          tone: 'success' as const,
          to: '/admin/books?status=AVAILABLE',
        },
        {
          label: '전체 대여',
          value: data.statistics.totalRentalCount.toLocaleString('ko-KR'),
          caption: `무료 ${data.statistics.freeRentalCount.toLocaleString('ko-KR')} / 유료 ${data.statistics.paidRentalCount.toLocaleString('ko-KR')}`,
          tone: 'info' as const,
          to: '/admin/rentals',
        },
        {
          label: '완독',
          value: data.statistics.totalReadBookCount.toLocaleString('ko-KR'),
          caption: '환경 지표 계산 기준',
          tone: 'success' as const,
          to: '/admin/rentals?status=OWNED',
        },
        {
          label: '결제 합계',
          value: `${data.statistics.totalPaymentAmount.toLocaleString('ko-KR')}P`,
          caption: '완료 PAID 기준',
          tone: 'warning' as const,
          to: '/admin/payments',
        },
        {
          label: '리뷰',
          value: data.statistics.reviewCount.toLocaleString('ko-KR'),
          caption: '활성(ACTIVE) 리뷰 기준',
          tone: 'info' as const,
          to: '/admin/reports?targetType=REVIEW',
        },
        {
          label: '신고',
          value: data.statistics.reportCount.toLocaleString('ko-KR'),
          caption: '책 + 리뷰 신고 합계',
          tone: 'danger' as const,
          to: '/admin/reports',
        },
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
          <div className="admin-dashboard-kpi-grid">
            {kpiCards.map((card) => (
              <Link className="admin-dashboard-kpi-card" to={card.to} key={card.label}>
                <span className={`admin-dashboard-kpi-pill admin-dashboard-kpi-pill-${card.tone}`}>{card.label}</span>
                <strong>{card.value}</strong>
                <span className="admin-dashboard-kpi-caption">{card.caption}</span>
              </Link>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>환경 지표</h2>
          <div className={styles.ecoRow}>
            <div className={styles.ecoCard}>
              <span className="admin-dashboard-kpi-pill admin-dashboard-kpi-pill-success">탄소 절약량</span>
              <strong className={styles.ecoValue}>{data.statistics.carbonSavedKg.toLocaleString('ko-KR')} kg</strong>
              <span className="admin-dashboard-kpi-caption">완독 수 × 2kg 기준</span>
            </div>
            <div className={styles.ecoCard}>
              <span className="admin-dashboard-kpi-pill admin-dashboard-kpi-pill-success">나무 보호량</span>
              <strong className={styles.ecoValue}>{data.statistics.treeSavedCount.toLocaleString('ko-KR')} 그루</strong>
              <span className="admin-dashboard-kpi-caption">완독 수 × 0.04그루 기준</span>
            </div>
          </div>

          {trends ? (
            <>
              <h2 className={styles.sectionTitle}>추이</h2>
              <div className={styles.chartGrid}>
                <TrendChart title="대여 추이" points={trends.rental} color="var(--color-primary)" unit="건" />
                <TrendChart title="결제 추이" points={trends.payment} color="var(--color-success)" unit="P" />
                <TrendChart title="완독 추이" points={trends.read} color="var(--color-warning)" unit="권" />
              </div>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
