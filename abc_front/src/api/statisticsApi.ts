import { apiClient } from './apiClient';
import type { ApiResponse, ReadingStatisticsData, ReadingStatisticsPeriodType, ReadingStatisticsQuery, ReadingTrendPoint } from '../types/api';

const periodTrendLabels: Record<ReadingStatisticsPeriodType, string[]> = {
  TOTAL: ['1월', '2월', '3월', '4월', '5월', '6월'],
  WEEKLY: ['월', '화', '수', '목', '금', '토', '일'],
  MONTHLY: ['1주', '2주', '3주', '4주', '5주'],
  YEARLY: ['1분기', '2분기', '3분기', '4분기'],
};

const periodSeed: Record<ReadingStatisticsPeriodType, number> = {
  TOTAL: 6,
  WEEKLY: 1,
  MONTHLY: 3,
  YEARLY: 12,
};

function buildTrendPoints(periodType: ReadingStatisticsPeriodType): ReadingTrendPoint[] {
  const seed = periodSeed[periodType];

  return periodTrendLabels[periodType].map((label, index) => {
    const readBookCount = Math.max(0, seed + index - (index % 2));

    return {
      label,
      rentalCount: readBookCount + 2 + (index % 3),
      readBookCount,
      readPageCount: readBookCount * 168 + index * 24,
    };
  });
}

function getSummaryFromTrend(trendPoints: ReadingTrendPoint[]) {
  return trendPoints.reduce(
    (summary, point) => ({
      rentalCount: summary.rentalCount + point.rentalCount,
      readBookCount: summary.readBookCount + point.readBookCount,
      readPageCount: summary.readPageCount + point.readPageCount,
      reviewCount: summary.reviewCount + Math.max(0, Math.round(point.readBookCount * 0.6)),
      favoriteCount: summary.favoriteCount + Math.max(0, Math.round(point.rentalCount * 0.4)),
    }),
    { rentalCount: 0, readBookCount: 0, readPageCount: 0, reviewCount: 0, favoriteCount: 0 },
  );
}

export async function getMyReadingStatistics(params: ReadingStatisticsQuery) {
  const response = await apiClient.get<ApiResponse<ReadingStatisticsData>>('/me/statistics', {
    params,
  });

  return response.data.data;
}

export function getFallbackReadingStatistics(params: ReadingStatisticsQuery): ReadingStatisticsData {
  const trendPoints = buildTrendPoints(params.periodType);
  const summary = getSummaryFromTrend(trendPoints);

  // backend API 미구현 기간 동안 U-026 화면 검수용 preview 데이터를 제공한다.
  return {
    periodType: params.periodType,
    baseDate: params.baseDate,
    summary,
    environmentMetrics: {
      carbonSavedKg: summary.readBookCount * 2,
      treeSavedCount: summary.readBookCount * 0.04,
      calculationDescription: '완독 도서 수 × 탄소 2kg, 완독 도서 수 × 나무 0.04그루',
    },
    trendPoints,
    generatedAt: new Date().toISOString(),
  };
}
