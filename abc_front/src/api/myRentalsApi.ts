import { apiClient } from './apiClient';
import type { ApiResponse, MyRentalsPage, MyRentalsQuery } from '../types/api';

export async function getMyRentals(params: MyRentalsQuery = {}) {
  const response = await apiClient.get<ApiResponse<MyRentalsPage>>('/me/rentals', {
    params,
  });

  return response.data.data;
}
