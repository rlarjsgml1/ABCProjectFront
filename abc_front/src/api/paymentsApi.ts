import { apiClient } from './apiClient';
import type { ApiResponse, PaymentHistoryPage, PaymentHistoryQuery } from '../types/api';

export async function getMyPayments(params: PaymentHistoryQuery = {}) {
  const response = await apiClient.get<ApiResponse<PaymentHistoryPage>>('/me/payments', {
    params,
  });

  return response.data.data;
}
