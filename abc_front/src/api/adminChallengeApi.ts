// 관리자 챌린지 목록 조회와 챌린지/보상 수정 API 클라이언트
import { apiClient } from './apiClient';
import type {
  AdminChallengeListQuery,
  AdminChallengeSummary,
  AdminChallengeUpdateRequest,
  AdminChallengeUpdateResponse,
  ApiResponse,
  PageResponse,
} from '../types/api';

export async function getAdminChallenges(query: AdminChallengeListQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminChallengeSummary>>>('/admin/challenges', {
    params: query,
  });

  return response.data.data;
}

export async function updateAdminChallenge(challengeId: number, payload: AdminChallengeUpdateRequest) {
  const response = await apiClient.put<ApiResponse<AdminChallengeUpdateResponse>>(`/admin/challenges/${challengeId}`, payload);

  return response.data.data;
}
