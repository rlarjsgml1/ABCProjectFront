// 관리자 대시보드(A-001) 화면 — KPI 통계와 최근 신고/희망도서/결제를 한 화면에서 보여주고 주요 관리 화면으로 이동시킨다
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard, getFallbackAdminDashboard } from '../../../api/adminDashboardApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import type { AdminDashboardResponse, AdminRecentReport } from '../../../types/api';

type KpiTone = 'info' | 'success' | 'warning' | 'danger';

type KpiCard = {
  label: string;
  value: string;
  caption: string;
  tone: KpiTone;
  to?: string;
};

type CombinedRecentItem = {
  key: string;
  type: '희망' | '결제';
  content: string;
  status: string;
  sortAt: number;
  linkLabel: string;
  linkTo: string;
};

const reportStatusLabels: Record<string, string> = {
  WAITING: '접수/대기',
  PROCESSING: '처리 중',
  DONE: '완료',
  REJECTED: '반려',
};

const candidateStatusLabels: Record<string, string> = {
  REQUESTED: '신청',
  IN_REVIEW: '검토 중',
  APPROVED: '승인',
  REJECTED: '반려',
};

function getReportTargetLabel(targetType: AdminRecentReport['targetType']) {
  return targetType === 'BOOK' ? '책' : '리뷰';
}

function buildKpiCards(statistics: AdminDashboardResponse['statistics']): KpiCard[] {
  const won = (value: number) => `${value.toLocaleString('ko-KR')}원`;
  const count = (value: number) => value.toLocaleString('ko-KR');

  return [
    {
      label: '전체 회원',
      value: count(statistics.totalMemberCount),
      caption: `제재 회원 ${count(statistics.sanctionedMemberCount)}명`,
      tone: 'info',
      to: '/admin/members',
    },
    {
      label: '제재 회원',
      value: count(statistics.sanctionedMemberCount),
      caption: '현재 유효 제재 기준',
      tone: 'danger',
      to: '/admin/members',
    },
    {
      label: '이용 가능 도서',
      value: count(statistics.activeBookCount),
      caption: '숨김/비활성 제외',
      tone: 'success',
      to: '/admin/books',
    },
    {
      label: '전체 대여',
      value: count(statistics.totalRentalCount),
      caption: `무료 ${count(statistics.freeRentalCount)} / 유료 ${count(statistics.paidRentalCount)}`,
      tone: 'info',
      to: '/admin/rentals',
    },
    {
      label: '완독',
      value: count(statistics.totalReadBookCount),
      caption: '환경 지표 계산 기준',
      tone: 'success',
      to: '/admin/statistics',
    },
    {
      label: '결제 합계',
      value: won(statistics.totalPaymentAmount),
      caption: '완료 PAID 기준',
      tone: 'warning',
      to: '/admin/payments',
    },
    {
      label: '리뷰',
      value: count(statistics.reviewCount),
      caption: '활성(ACTIVE) 리뷰 기준',
      tone: 'info',
    },
    {
      label: '신고',
      value: count(statistics.reportCount),
      caption: '책 + 리뷰 신고 합계',
      tone: 'danger',
      to: '/admin/reports',
    },
  ];
}

function buildCombinedRecent(dashboard: AdminDashboardResponse): CombinedRecentItem[] {
  const requests: CombinedRecentItem[] = dashboard.recentBookRequests.map((item) => ({
    key: `request-${item.candidateId}`,
    type: '희망',
    content: item.title,
    status: candidateStatusLabels[item.candidateStatus] ?? item.candidateStatus,
    sortAt: new Date(item.firstRequestedAt).getTime(),
    linkLabel: 'A-011',
    linkTo: '/admin/book-requests',
  }));

  const payments: CombinedRecentItem[] = dashboard.recentPayments.map((item) => ({
    key: `payment-${item.paymentId}`,
    type: '결제',
    content: `${item.memberName} · ${item.amount.toLocaleString('ko-KR')}원`,
    status: item.paymentStatus,
    sortAt: new Date(item.paidAt).getTime(),
    linkLabel: 'A-009',
    linkTo: '/admin/payments',
  }));

  return [...requests, ...payments].sort((a, b) => b.sortAt - a.sortAt);
}

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);

      try {
        const data = await getAdminDashboard();
        if (!ignore) {
          setDashboard(data);
          setErrorMessage('');
        }
      } catch (error) {
        if (!ignore) {
          setDashboard(getFallbackAdminDashboard());
          setErrorMessage(`${getApiErrorMessage(error)} 서버 연결 전까지 임시 데이터가 표시됩니다.`);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="page-section">
        <div className="status-banner">데이터를 불러오는 중입니다.</div>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="page-section">
        <h1>관리자 대시보드</h1>
        <div className="status-banner status-banner-error">대시보드 데이터를 불러오지 못했습니다.</div>
      </section>
    );
  }

  const kpiCards = buildKpiCards(dashboard.statistics);
  const combinedRecent = buildCombinedRecent(dashboard);

  return (
    <div className="admin-dashboard">
      <section className="page-section admin-dashboard-header">
        <div className="admin-dashboard-header-top">
          <span className="admin-dashboard-eyebrow">Admin</span>
          <Link className="button button-primary" to="/admin/statistics">
            전체 통계 → A-016
          </Link>
        </div>
        <h1>관리자 대시보드</h1>
        <p>운영 KPI와 최근 처리 대상을 한 화면에서 확인합니다.</p>
        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}
      </section>

      <div className="admin-dashboard-kpi-grid">
        {kpiCards.map((card) => {
          const content = (
            <>
              <span className={`admin-dashboard-kpi-pill admin-dashboard-kpi-pill-${card.tone}`}>{card.label}</span>
              <strong>{card.value}</strong>
              <span className="admin-dashboard-kpi-caption">{card.caption}</span>
            </>
          );

          return card.to ? (
            <Link className="admin-dashboard-kpi-card" to={card.to} key={card.label}>
              {content}
            </Link>
          ) : (
            <div className="admin-dashboard-kpi-card" key={card.label}>
              {content}
            </div>
          );
        })}
      </div>

      <div className="admin-dashboard-panels">
        <section className="page-section admin-dashboard-panel">
          <h2>빠른 작업</h2>
          <p className="admin-dashboard-panel-hint">도서 등록, 컬렉션 등록, 공지 등록, 쿠폰 발급</p>
          <div className="admin-dashboard-quick-actions">
            <Link className="button button-primary" to="/admin/books/new">
              도서 등록 → A-005
            </Link>
            <Link className="button button-secondary" to="/admin/collections">
              컬렉션 등록 → A-018
            </Link>
            <Link className="button button-secondary" to="/admin/notices">
              공지 등록 → A-012
            </Link>
            <Link className="button button-secondary" to="/admin/coupons-points">
              쿠폰 발급 → A-013
            </Link>
          </div>
        </section>

        <section className="page-section admin-dashboard-panel">
          <h2>최근 신고</h2>
          {dashboard.recentReports.length === 0 ? (
            <p className="admin-dashboard-panel-hint">최근 데이터가 없습니다.</p>
          ) : (
            <table className="admin-dashboard-table">
              <thead>
                <tr>
                  <th>대상</th>
                  <th>신고자</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentReports.map((report) => (
                  <tr key={`${report.targetType}-${report.reportId}`}>
                    <td>{getReportTargetLabel(report.targetType)}</td>
                    <td>{report.reporterName}</td>
                    <td>{reportStatusLabels[report.reportStatus] ?? report.reportStatus}</td>
                    <td>
                      <Link to="/admin/reports">보기</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="page-section admin-dashboard-panel">
          <h2>최근 희망도서/결제</h2>
          {combinedRecent.length === 0 ? (
            <p className="admin-dashboard-panel-hint">최근 데이터가 없습니다.</p>
          ) : (
            <table className="admin-dashboard-table">
              <thead>
                <tr>
                  <th>유형</th>
                  <th>내용</th>
                  <th>상태</th>
                  <th>이동</th>
                </tr>
              </thead>
              <tbody>
                {combinedRecent.map((item) => (
                  <tr key={item.key}>
                    <td>{item.type}</td>
                    <td>{item.content}</td>
                    <td>{item.status}</td>
                    <td>
                      <Link to={item.linkTo}>{item.linkLabel}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
