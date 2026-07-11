import { useEffect, useState } from 'react';
import { getMyReports } from '../../../api/reportsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Modal } from '../../../components/common/Modal';
import { Table } from '../../../components/common/Table';
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

        <Table<ReportHistoryItem>
          columns={[
            { key: 'reportId', header: '신고번호' },
            {
              key: 'target',
              header: '대상',
              render: (report) => `${getTargetTypeLabel(report.targetType)}${report.targetTitle ? ` · ${report.targetTitle}` : ''}`,
            },
            { key: 'reportType', header: '신고유형' },
            { key: 'status', header: '상태', render: (report) => getStatusLabel(report.status) },
            { key: 'createdAt', header: '접수일', render: (report) => formatDate(report.createdAt) },
            { key: 'processedAt', header: '처리일', render: (report) => formatDate(report.processedAt) },
            {
              key: 'detail',
              header: '상세',
              render: (report) => (
                <button type="button" className="button button-secondary" onClick={() => setSelectedReport(report)}>
                  상세보기
                </button>
              ),
            },
          ]}
          rows={reports}
          rowKey={(report) => report.reportId}
          isLoading={isLoading}
          loadingMessage="신고 내역을 불러오는 중입니다."
          emptyMessage="신고 내역이 없습니다."
        />
      </section>

      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        eyebrow="REPORT DETAIL"
        title="신고 상세"
        titleId="report-detail-title"
        closeLabel="신고 상세 닫기"
      >
        {selectedReport ? (
          <>
            <p>신고번호 {selectedReport.reportId}</p>
            <p>대상 {getTargetTypeLabel(selectedReport.targetType)}</p>
            <p>신고 내용 {selectedReport.content ?? '-'}</p>
            <p>처리 결과 {selectedReport.resultMessage ?? '처리 중입니다.'}</p>
          </>
        ) : null}
      </Modal>
    </MyPageLayout>
  );
}
