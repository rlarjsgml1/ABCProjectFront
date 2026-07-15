// 내 독서 통계 조회 API와 백엔드 미구현 기간 대비 fallback 통계 데이터 생성 로직
import { apiClient } from './apiClient';
import type {
  ApiResponse,
  RawReadingStatisticsResponse,
  ReadingStatisticsData,
  ReadingStatisticsPeriodType,
  ReadingStatisticsQuery,
  ReadingTrendPoint,
} from '../types/api';

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

// 백엔드가 summary/environmentMetrics 껍데기 없이 필드를 최상위에 바로 내려주고,
// readingTrend 각 항목은 완독 수(count) 하나만 주는 것을 프론트 표시 모양으로 변환한다.
function mapReadingStatistics(raw: RawReadingStatisticsResponse, baseDate?: string): ReadingStatisticsData {
  return {
    periodType: raw.periodType,
    baseDate,
    summary: {
      rentalCount: raw.rentalCount,
      readBookCount: raw.readBookCount,
      readPageCount: raw.readPageCount,
      reviewCount: raw.reviewCount,
      favoriteCount: raw.favoriteCount,
    },
    environmentMetrics: {
      carbonSavedKg: raw.carbonSavedKg,
      treeSavedCount: raw.treeSavedCount,
      calculationDescription: '완독 도서 수 × 탄소 2kg, 완독 도서 수 × 나무 0.04그루',
    },
    trendPoints: raw.readingTrend.map((point) => ({
      label: point.label,
      periodStartDate: point.periodStartDate,
      periodEndDate: point.periodEndDate,
      rentalCount: 0,
      readBookCount: point.count,
      readPageCount: 0,
    })),
    generatedAt: raw.updatedAt,
  };
}

export async function getMyReadingStatistics(params: ReadingStatisticsQuery) {
  const response = await apiClient.get<ApiResponse<RawReadingStatisticsResponse>>('/me/statistics', {
    params,
  });

  return mapReadingStatistics(response.data.data, params.baseDate);
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
