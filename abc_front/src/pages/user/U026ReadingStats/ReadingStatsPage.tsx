// 독서 통계(U026) 화면 — 기간별 독서량 추이 차트와 탄소·나무 절약 등 환경 기여 지표를 보여준다
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { getFallbackReadingStatistics, getMyReadingStatistics } from '../../../api/statisticsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { ReadingStatisticsData, ReadingStatisticsPeriodType } from '../../../types/api';

const periodTabs: Array<{ label: string; value: ReadingStatisticsPeriodType }> = [
  { label: '전체', value: 'TOTAL' },
  { label: '주간', value: 'WEEKLY' },
  { label: '월간', value: 'MONTHLY' },
  { label: '연간', value: 'YEARLY' },
];

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatNumber(value: number) {
  return (Number.isFinite(value) ? value : 0).toLocaleString('ko-KR');
}

function formatCarbon(value: number) {
  return `${formatNumber(value)}kg`;
}

function formatTree(value: number) {
  return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}그루`;
}

function ReadingStatisticsTooltip({ active, label, payload }: TooltipContentProps) {
  if (!active || !payload.length) {
    return null;
  }

  const readBookCount = Number(payload[0]?.value ?? 0);

  return (
    <div className="reading-statistics-chart-tooltip">
      <p className="reading-statistics-chart-tooltip-label">{label}</p>
      <p className="reading-statistics-chart-tooltip-value">
        <span>완독 수</span>
        <strong>{formatNumber(readBookCount)}권</strong>
      </p>
    </div>
  );
}

export function ReadingStatsPage() {
  const [activePeriod, setActivePeriod] = useState<ReadingStatisticsPeriodType>('TOTAL');
  const [baseDate, setBaseDate] = useState(() => formatDateInputValue(new Date()));
  const [statistics, setStatistics] = useState<ReadingStatisticsData>(() =>
    getFallbackReadingStatistics({ periodType: 'TOTAL', baseDate: formatDateInputValue(new Date()) }),
  );
  const [isStatisticsLoading, setIsStatisticsLoading] = useState(true);
  const [statisticsError, setStatisticsError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadStatistics() {
      const query = { periodType: activePeriod, baseDate };
      setIsStatisticsLoading(true);
      setStatisticsError('');

      try {
        const data = await getMyReadingStatistics(query);
        if (!ignore) {
          setStatistics(data);
        }
      } catch (error) {
        if (!ignore) {
          setStatistics(getFallbackReadingStatistics(query));
          setStatisticsError(`${getApiErrorMessage(error)} 미리보기 통계로 표시합니다.`);
        }
      } finally {
        if (!ignore) {
          setIsStatisticsLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      ignore = true;
    };
  }, [activePeriod, baseDate]);

  const completionRate = statistics.summary.rentalCount > 0
    ? Math.round((statistics.summary.readBookCount / statistics.summary.rentalCount) * 100)
    : 0;
  const summaryCards = [
    { label: '대여 수', value: `${formatNumber(statistics.summary.rentalCount)}권` },
    { label: '완독 수', value: `${formatNumber(statistics.summary.readBookCount)}권` },
    { label: '대여 대비 완독률', value: `${formatNumber(completionRate)}%` },
  ];
  const secondaryMetrics = [
    { label: '리뷰 수', value: `${formatNumber(statistics.summary.reviewCount)}건` },
    { label: '즐겨찾기 수 (현재)', value: `${formatNumber(statistics.summary.favoriteCount)}권` },
  ];
  return (
    <MyPageLayout titleId="reading-stats-title">
      <section className="page-section reading-statistics-page">
        <div className="section-heading-row reading-statistics-heading">
          <div>
            <h2 id="reading-stats-title">나의 독서 통계</h2>
          </div>
          <span>독서 흐름과 환경 기여 지표</span>
        </div>

        <div className="reading-statistics-controls" aria-label="통계 조회 조건">
          <div className="reading-statistics-tabs" role="tablist" aria-label="통계 기간 선택">
            {periodTabs.map((tab) => (
              <button
                className={`reading-statistics-tab${activePeriod === tab.value ? ' is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={activePeriod === tab.value}
                key={tab.value}
                onClick={() => setActivePeriod(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="reading-statistics-date-field">
            <span>기준일</span>
            <input type="date" value={baseDate} onChange={(event) => setBaseDate(event.target.value)} />
          </label>
        </div>

        {statisticsError ? <div className="status-banner status-banner-error">{statisticsError}</div> : null}
        {isStatisticsLoading ? <div className="status-banner">독서 통계를 불러오는 중입니다.</div> : null}

        <div className="reading-statistics-summary-grid" aria-label="독서 통계 요약">
          {summaryCards.map((card) => (
            <article className="reading-statistics-summary-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>

        <div className="reading-statistics-secondary-row" aria-label="추가 활동 지표">
          {secondaryMetrics.map((metric) => (
            <span className="reading-statistics-pill" key={metric.label}>
              {metric.label} <strong>{metric.value}</strong>
            </span>
          ))}
        </div>

        <div className="reading-statistics-dashboard">
          <section className="reading-statistics-chart-card" aria-labelledby="reading-trend-title">
            <div className="section-heading-row">
              <div>
                <p className="reading-statistics-kicker">READING VOLUME</p>
                <h3 id="reading-trend-title">완독 수 추이</h3>
              </div>
              <span>{periodTabs.find((tab) => tab.value === statistics.periodType)?.label}</span>
            </div>

            <div className="reading-statistics-chart" role="img" aria-label="기간별 완독 수 막대그래프">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.trendPoints} margin={{ top: 12, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke="var(--reading-statistics-chart-grid)" strokeDasharray="4 8" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--reading-statistics-chart-muted)' }}
                    tickMargin={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--reading-statistics-chart-muted)' }}
                    tickMargin={12}
                    width={64}
                    tickFormatter={(value) => `${formatNumber(value)}권`}
                  />
                  <Tooltip
                    content={(tooltipProps: TooltipContentProps) => <ReadingStatisticsTooltip {...tooltipProps} />}
                    cursor={{ fill: 'var(--reading-statistics-chart-cursor)' }}
                  />
                  <Bar
                    dataKey="readBookCount"
                    fill="var(--reading-statistics-chart-bar)"
                    name="완독 수"
                    radius={[8, 8, 8, 8]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <aside className="reading-statistics-environment-card" aria-labelledby="reading-environment-title">
            <div>
              <p className="reading-statistics-kicker">GREEN READING</p>
              <h3 id="reading-environment-title">환경 지표</h3>
            </div>
            <div className="reading-statistics-environment-grid">
              <div className="reading-statistics-environment-metric">
                <span>탄소 절약량</span>
                <strong>{formatCarbon(statistics.environmentMetrics.carbonSavedKg)}</strong>
              </div>
              <div className="reading-statistics-environment-metric">
                <span>나무 절약량</span>
                <strong>{formatTree(statistics.environmentMetrics.treeSavedCount)}</strong>
              </div>
            </div>
            <p>{statistics.environmentMetrics.calculationDescription}</p>
          </aside>
        </div>
      </section>
    </MyPageLayout>
  );
}
