// 회원가입/로그인 API 클라이언트와 인증 상태 변경 이벤트 이름 상수
import { apiClient } from './apiClient';
import type {
  ApiResponse,
  CheckLoginIdResponse,
  FindIdRequest,
  FindIdResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from '../types/api';

export const AUTH_CHANGED_EVENT = 'abc-auth-changed';

export async function signup(payload: SignupRequest) {
  const response = await apiClient.post<ApiResponse<SignupResponse>>('/auth/signup', payload);
  return response.data.data;
}

// 백엔드 미구현 API. GET /api/v1/auth/check-login-id?loginId=... 스펙으로 요청해둔 상태 — 구현되면 바로 연동됨.
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
