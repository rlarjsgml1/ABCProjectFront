// 내 챌린지 목록 조회 및 챌린지 보상 수령 API 클라이언트
import { apiClient } from './apiClient';
import type { ApiResponse, ChallengeListResponse, ChallengeRewardResult } from '../types/api';

export async function getMyChallenges() {
  const response = await apiClient.get<ApiResponse<ChallengeListResponse>>('/challenges');

  return response.data.data;
}

export async function claimChallengeReward(challengeId: number) {
  const response = await apiClient.post<ApiResponse<ChallengeRewardResult>>(`/challenges/${challengeId}/reward`);

  return response.data.data;
}
