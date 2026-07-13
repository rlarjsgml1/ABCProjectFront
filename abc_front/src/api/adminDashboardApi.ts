// 관리자 대시보드(A-001) API 클라이언트 — KPI 통계와 최근 결제/신고/희망도서 목록 조회
import { apiClient } from './apiClient';
import type { AdminDashboardResponse, ApiResponse } from '../types/api';

export async function getAdminDashboard() {
  const response = await apiClient.get<ApiResponse<AdminDashboardResponse>>('/admin/dashboard');

  return response.data.data;
}

// 백엔드 500 등으로 대시보드 조회가 실패했을 때 화면 구조를 확인할 수 있도록 보여주는 임시 데이터.
// 실패 시에도 에러 메시지는 함께 표시하므로 실패 자체를 가리지는 않는다.
export function getFallbackAdminDashboard(): AdminDashboardResponse {
  return {
    statistics: {
      totalMemberCount: 30000,
      sanctionedMemberCount: 37,
      activeBookCount: 8700,
      totalRentalCount: 1936,
      freeRentalCount: 1284,
      paidRentalCount: 652,
      totalReadBookCount: 642,
      totalPaymentAmount: 4820000,
      reviewCount: 12480,
      reportCount: 9,
      carbonSavedKg: 1284,
      treeSavedCount: 25.68,
    },
    recentPayments: [
      { paymentId: 1, memberName: 'kim_book', amount: 3000, paymentStatus: 'PAID', paidAt: '2026-07-12T18:20:00' },
      { paymentId: 2, memberName: 'lee_joy', amount: 4500, paymentStatus: 'PAID', paidAt: '2026-07-12T16:05:00' },
    ],
    recentReports: [
      {
        reportId: 1,
        targetType: 'REVIEW',
        targetId: 101,
        targetTitle: '클린 코드',
        reportType: '욕설 및 비방',
        reportStatus: 'WAITING',
        reporterName: 'park_reader',
        createdAt: '2026-07-12T19:40:00',
      },
      {
        reportId: 2,
        targetType: 'BOOK',
        targetId: 202,
        targetTitle: '데이터 시각화 입문',
        reportType: '책의 오류 및 수정',
        reportStatus: 'PROCESSING',
        reporterName: 'kim_book',
        createdAt: '2026-07-12T14:10:00',
      },
      {
        reportId: 3,
        targetType: 'REVIEW',
        targetId: 103,
        targetTitle: 'AI 서비스 기획',
        reportType: '스포일러',
        reportStatus: 'REJECTED',
        reporterName: 'lee_joy',
        createdAt: '2026-07-11T09:30:00',
      },
    ],
    recentBookRequests: [
      {
        candidateId: 1,
        title: '데이터 시각화 입문',
        author: '미상',
        publisher: '미상',
        requestCount: 4,
        candidateStatus: 'IN_REVIEW',
        firstRequestedAt: '2026-07-12T11:00:00',
      },
      {
        candidateId: 2,
        title: 'AI 서비스 기획',
        author: '미상',
        publisher: '미상',
        requestCount: 2,
        candidateStatus: 'REQUESTED',
        firstRequestedAt: '2026-07-11T15:20:00',
      },
    ],
  };
}
