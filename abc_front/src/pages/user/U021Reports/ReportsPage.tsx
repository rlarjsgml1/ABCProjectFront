import { useEffect, useState } from 'react';
import { getMyReports } from '../../../api/reportsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { ReportHistoryItem, ReportHistoryPage, ReportStatus, ReportTargetType } from '../../../types/api';

const pageSize = 10;

const targetTypeOptions: Array<{ label: string; value: ReportTargetType | '' }> = [
  { label: '전체', value: '' },
  { label: '책', value: 'BOOK' },
  { label: '리뷰', value: 'REVIEW' },
];

const statusOptions: Array<{ label: string; value: ReportStatus | '' }> = [
  { label: '전체', value: '' },
  { label: '접수/대기', value: 'WAITING' },
  { label: '처리 중', value: 'PROCESSING' },
  { label: '완료', value: 'DONE' },
  { label: '반려', value: 'REJECTED' },
];

function formatDate(value: string | undefined) {
  if (!value) {
    return '-';
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

function getTargetTypeLabel(value: ReportTargetType) {
  return value === 'BOOK' ? '책' : '리뷰';
}

function getStatusLabel(value: ReportStatus) {
  const option = statusOptions.find((item) => item.value === value);
  return option?.label ?? value;
}

export function ReportsPage() {
  const [targetType, setTargetType] = useState<ReportTargetType | ''>('');
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [reportsPage, setReportsPage] = useState<ReportHistoryPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportHistoryItem | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadReports() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getMyReports({
          targetType: targetType || undefined,
          status: status || undefined,
          page: 0,
          size: pageSize,
        });

        if (!ignore) {
          setReportsPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setReportsPage(null);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      ignore = true;
    };
  }, [targetType, status]);

  const reports = reportsPage?.content ?? [];

  return (
    <MyPageLayout titleId="reports-title">
      <section className="page-section reports-page">
        <div className="section-heading-row">
          <div>
            <h2 id="reports-title">내 신고 내역</h2>
          </div>
          <span>회원 대상 신고 내역은 제공하지 않습니다</span>
        </div>

        <div className="points-coupons-toolbar">
          <label>
            <span>대상</span>
            <select value={targetType} onChange={(event) => setTargetType(event.target.value as ReportTargetType | '')}>
              {targetTypeOptions.map((option) => (
                <option key={option.value || 'ALL'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>처리 상태</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as ReportStatus | '')}>
              {statusOptions.map((option) => (
                <option key={option.value || 'ALL'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

        <div className="points-coupons-table-wrap">
          <table className="points-coupons-table">
            <thead>
              <tr>
                <th scope="col">신고번호</th>
                <th scope="col">대상</th>
                <th scope="col">신고유형</th>
                <th scope="col">상태</th>
                <th scope="col">접수일</th>
                <th scope="col">처리일</th>
                <th scope="col">상세</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7}>신고 내역을 불러오는 중입니다.</td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.reportId}>
                    <td>{report.reportId}</td>
                    <td>{getTargetTypeLabel(report.targetType)}{report.targetTitle ? ` · ${report.targetTitle}` : ''}</td>
                    <td>{report.reportType}</td>
                    <td>{getStatusLabel(report.status)}</td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>{formatDate(report.processedAt)}</td>
                    <td>
                      <button type="button" className="button button-secondary" onClick={() => setSelectedReport(report)}>
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>신고 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedReport ? (
        <div className="membership-modal-backdrop" onClick={() => setSelectedReport(null)}>
          <section
            className="membership-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="membership-modal-header">
              <div>
                <p className="eyebrow">REPORT DETAIL</p>
                <h2 id="report-detail-title">신고 상세</h2>
              </div>
              <button
                className="membership-modal-close"
                type="button"
                aria-label="신고 상세 닫기"
                onClick={() => setSelectedReport(null)}
              >
                ×
              </button>
            </div>

            <div className="membership-modal-body">
              <p>신고번호 {selectedReport.reportId}</p>
              <p>대상 {getTargetTypeLabel(selectedReport.targetType)}</p>
              <p>신고 내용 {selectedReport.content ?? '-'}</p>
              <p>처리 결과 {selectedReport.resultMessage ?? '처리 중입니다.'}</p>
            </div>
          </section>
        </div>
      ) : null}
    </MyPageLayout>
  );
}
