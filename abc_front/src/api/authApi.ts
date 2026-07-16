// 회원가입/로그인 API 클라이언트와 인증 상태 변경 이벤트 이름 상수
import { apiClient } from './apiClient';
import type {
  ApiResponse,
  CheckLoginIdResponse,
  FindIdRequest,
  FindIdResponse,
  LoginRequest,
  LoginResponse,
  PasswordResetConfirmPayload,
  PasswordResetConfirmResponse,
  PasswordResetRequestPayload,
  PasswordResetRequestResponse,
  PasswordResetVerifyPayload,
  PasswordResetVerifyResponse,
  SignupRequest,
  SignupResponse,
} from '../types/api';

export const AUTH_CHANGED_EVENT = 'abc-auth-changed';

export async function signup(payload: SignupRequest) {
  const response = await apiClient.post<ApiResponse<SignupResponse>>('/auth/signup', payload);
  return response.data.data;
}

export async function checkLoginId(loginId: string) {
  const response = await apiClient.get<ApiResponse<CheckLoginIdResponse>>('/auth/check-login-id', {
    params: { loginId },
  });
  return response.data.data;
}

export async function login(payload: LoginRequest) {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload);
  return response.data.data;
}

export async function findId(payload: FindIdRequest) {
  const response = await apiClient.post<ApiResponse<FindIdResponse>>('/auth/find-id', payload);
  return response.data.data;
}

// 아래 세 함수는 전부 백엔드 미구현 API. ERD 문서 "13.12 비밀번호 재설정 정책" 스펙으로 요청해둔 상태 — 구현되면 바로 연동됨.
export async function requestPasswordReset(payload: PasswordResetRequestPayload) {
  const response = await apiClient.post<ApiResponse<PasswordResetRequestResponse>>(
    '/auth/password-reset/request',
    payload,
  );
  return response.data.data;
}

export async function verifyPasswordResetCode(payload: PasswordResetVerifyPayload) {
  const response = await apiClient.post<ApiResponse<PasswordResetVerifyResponse>>(
    '/auth/password-reset/verify',
    payload,
  );
  return response.data.data;
}

export async function confirmPasswordReset(payload: PasswordResetConfirmPayload) {
  const response = await apiClient.post<ApiResponse<PasswordResetConfirmResponse>>(
    '/auth/password-reset/confirm',
    payload,
  );
  return response.data.data;
}
