import { apiClient } from './apiClient';
import type { ApiResponse, ChallengeItem, ChallengeListResponse, ChallengeRewardResult } from '../types/api';

export async function getMyChallenges() {
  const response = await apiClient.get<ApiResponse<ChallengeListResponse>>('/challenges');

  return response.data.data;
}

export async function claimChallengeReward(challengeId: number) {
  const response = await apiClient.post<ApiResponse<ChallengeRewardResult>>(`/challenges/${challengeId}/reward`);

  return response.data.data;
}

export const fallbackChallenges: ChallengeItem[] = [
  {
    challengeId: 1,
    title: '출석체크 7일 달성',
    description: '7일 동안 매일 출석체크를 완료해 보세요.',
    challengeType: 'DAILY',
    goalAction: '출석체크하기',
    currentCount: 5,
    goalCount: 7,
    progressRate: 63,
    rewardName: '500포인트',
    rewardType: 'POINT',
    rewardAmount: 500,
    rewardStatus: 'NOT_AVAILABLE',
    status: 'IN_PROGRESS',
    startedAt: '2026-07-01',
    endsAt: '2026-07-31',
  },
  {
    challengeId: 2,
    title: '한 달 독서 3권 완료',
    description: '이번 달에 대여한 도서 3권을 끝까지 읽어보세요.',
    challengeType: 'TOTAL',
    goalAction: '도서 읽기',
    currentCount: 3,
    goalCount: 3,
    progressRate: 100,
    rewardName: '10% 할인 쿠폰',
    rewardType: 'COUPON',
    rewardStatus: 'AVAILABLE',
    status: 'COMPLETED',
    startedAt: '2026-07-01',
    endsAt: '2026-07-31',
  },
  {
    challengeId: 3,
    title: '누적 1,000페이지 읽기',
    description: '누적 독서 페이지 1,000페이지를 달성해 보세요.',
    challengeType: 'TOTAL',
    goalAction: '전자책 읽기',
    currentCount: 1000,
    goalCount: 1000,
    progressRate: 100,
    rewardName: '보상 완료',
    rewardType: 'POINT',
    rewardAmount: 1000,
    rewardStatus: 'RECEIVED',
    status: 'COMPLETED',
    startedAt: '2026-06-01',
    endsAt: '2026-07-31',
  },
];
