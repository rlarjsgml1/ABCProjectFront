// 내 프로필 조회/수정, 비밀번호 변경, 회원 탈퇴 API와 공통 에러 메시지 추출 유틸
import { isAxiosError } from 'axios';
import { apiClient } from './apiClient';
import type {
  ApiResponse,
  ErrorResponse,
  UserPasswordChangeRequest,
  UserProfile,
  UserProfileUpdateRequest,
} from '../types/api';

// apiClient의 baseURL에 /api/v1이 포함되어 있으므로 API 명세의 하위 경로만 사용한다.
export async function getMyProfile() {
  const response = await apiClient.get<ApiResponse<UserProfile>>('/me');
  return response.data.data;
}

export async function updateMyProfile(payload: UserProfileUpdateRequest) {
  const response = await apiClient.patch<ApiResponse<UserProfile>>('/me', payload);
  return response.data.data;
}

export async function changeMyPassword(payload: UserPasswordChangeRequest) {
  const response = await apiClient.patch<ApiResponse<void>>('/me/password', payload);
  return response.data;
}

export async function withdrawMyAccount() {
  const response = await apiClient.delete<ApiResponse<void>>('/me');
  return response.data;
}

export function getApiErrorMessage(error: unknown) {
  if (isAxiosError<ErrorResponse>(error)) {
    return error.response?.data.message ?? '요청을 처리하지 못했습니다.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '요청을 처리하지 못했습니다.';
}
