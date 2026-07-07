import { apiClient } from './apiClient';
import type { ApiResponse, LoginRequest, LoginResponse, SignupRequest, SignupResponse } from '../types/api';

export const AUTH_CHANGED_EVENT = 'abc-auth-changed';

export async function signup(payload: SignupRequest) {
  const response = await apiClient.post<ApiResponse<SignupResponse>>('/auth/signup', payload);
  return response.data.data;
}

export async function login(payload: LoginRequest) {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload);
  return response.data.data;
}
