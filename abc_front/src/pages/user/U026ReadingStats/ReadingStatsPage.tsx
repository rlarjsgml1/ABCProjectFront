import { useEffect, useState, type CSSProperties } from 'react';
import { getFallbackReadingStatistics, getMyReadingStatistics } from '../../../api/statisticsApi';
import { getApiErrorMessage, getMyProfile } from '../../../api/profileApi';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { ReadingStatisticsData, ReadingStatisticsPeriodType, ReadingTrendPoint, UserProfile } from '../../../types/api';

type TrendBarStyle = CSSProperties & {
  '--reading-stat-height': string;
};

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
  return value.toLocaleString('ko-KR');
}

function formatCarbon(value: number) {
  return `${formatNumber(value)}kg`;
}

function formatTree(value: number) {
  return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}그루`;
}

function getTrendBarStyle(point: ReadingTrendPoint, maxReadPageCount: number): TrendBarStyle {
  const percent = maxReadPageCount > 0 ? Math.max(8, Math.round((point.readPageCount / maxReadPageCount) * 100)) : 8;

  return { '--reading-stat-height': `${percent}%` };
}

export function ReadingStatsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [activePeriod, setActivePeriod] = useState<ReadingStatisticsPeriodType>('TOTAL');
  const [baseDate, setBaseDate] = useState(() => formatDateInputValue(new Date()));
  const [statistics, setStatistics] = useState<ReadingStatisticsData>(() =>
    getFallbackReadingStatistics({ periodType: 'TOTAL', baseDate: formatDateInputValue(new Date()) }),
  );
  const [isStatisticsLoading, setIsStatisticsLoading] = useState(true);
  const [statisticsError, setStatisticsError] = useState('');

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

  const summaryCards = [
    { label: '대여 수', value: `${formatNumber(statistics.summary.rentalCount)}권` },
    { label: '완독 수', value: `${formatNumber(statistics.summary.readBookCount)}권` },
    { label: '읽은 페이지', value: `${formatNumber(statistics.summary.readPageCount)}p` },
  ];
  const secondaryMetrics = [
    { label: '리뷰 수', value: `${formatNumber(statistics.summary.reviewCount)}건` },
    { label: '즐겨찾기 수', value: `${formatNumber(statistics.summary.favoriteCount)}권` },
  ];
  const maxReadPageCount = Math.max(...statistics.trendPoints.map((point) => point.readPageCount), 0);

  return (
    <MyPageLayout profile={profile} isLoading={isProfileLoading} errorMessage={profileError} titleId="reading-stats-title">
      <section className="page-section reading-statistics-page">
        <div className="section-heading-row reading-statistics-heading">
          <div>
            <p className="eyebrow">U-026 READING STATISTICS</p>
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
                <h3 id="reading-trend-title">독서량 추이</h3>
              </div>
              <span>{periodTabs.find((tab) => tab.value === statistics.periodType)?.label}</span>
            </div>

            <div className="reading-statistics-chart" role="img" aria-label="기간별 읽은 페이지 막대그래프">
              {statistics.trendPoints.map((point) => (
                <div className="reading-statistics-chart-item" key={point.label}>
                  <div className="reading-statistics-bar-track" aria-hidden="true">
                    <span className="reading-statistics-bar-fill" style={getTrendBarStyle(point, maxReadPageCount)} />
                  </div>
                  <strong>{formatNumber(point.readPageCount)}p</strong>
                  <span>{point.label}</span>
                </div>
              ))}
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
