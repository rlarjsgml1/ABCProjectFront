import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAdminReports, updateAdminReportStatus } from '../../../api/adminReportApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminReportItem,
  AdminReportListQuery,
  AdminReportPage,
  AdminReportStatusUpdateRequest,
  AdminSanctionType,
  ReportStatus,
  ReportTargetType,
} from '../../../types/api';
import styles from '../../../styles/AdminReportListPage.module.css';

const PAGE_SIZE = 10;

type ProcessForm = {
  status: ReportStatus;
  processResult: string;
  hideReviewYn: boolean;
  useSanction: boolean;
  sanctionType: AdminSanctionType;
  startedAt: string;
  endedAt: string;
  sanctionReason: string;
};

const targetTypeOptions: Array<{ value: ReportTargetType; label: string }> = [
  { value: 'BOOK', label: '도서신고' },
  { value: 'REVIEW', label: '리뷰신고' },
];

const statusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: 'WAITING', label: '접수/대기' },
  { value: 'PROCESSING', label: '처리 중' },
  { value: 'DONE', label: '완료' },
  { value: 'REJECTED', label: '반려' },
];

const sanctionTypeOptions: Array<{ value: AdminSanctionType; label: string }> = [
  { value: 'ACCOUNT_SUSPENSION', label: '계정 정지' },
  { value: 'SERVICE_LIMIT', label: '서비스 제한' },
  { value: 'WARNING', label: '경고' },
];

const fallbackReports: AdminReportItem[] = [
  {
    reportId: 4021,
    targetType: 'BOOK',
    reporter: {
      memberId: 1024,
      loginId: 'park_reader',
      name: '박서연',
    },
    targetInfo: {
      targetId: 88,
      title: '데이터베이스 첫걸음',
      authorName: '박서연',
    },
    reportType: '도서 정보 오류',
    content: '도서 소개에 오탈자가 있어 확인이 필요합니다.',
    status: 'WAITING',
    managerName: '-',
    createdAt: '2026-07-12T09:30:00',
  },
  {
    reportId: 4059,
    targetType: 'REVIEW',
    reporter: {
      memberId: 873,
      loginId: 'review_stop',
      name: '이민준',
    },
    targetInfo: {
      targetId: 611,
      bookTitle: '리액트 운영 패턴',
      reviewContent: '결말과 핵심 내용이 그대로 포함된 리뷰입니다.',
      reviewStatus: 'VISIBLE',
    },
    reportType: '스포일러 포함',
    content: '리뷰에 주요 결말이 포함되어 숨김 처리가 필요합니다.',
    status: 'PROCESSING',
    managerName: '운영관리자',
    createdAt: '2026-07-13T10:10:00',
  },
];

function toApiPage(uiPage: number) {
  return Math.max(uiPage - 1, 0);
}

function toUiPage(apiPage: number | undefined) {
  return (apiPage ?? 0) + 1;
}

function getOptionLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T | string | undefined) {
  return options.find((option) => option.value === value)?.label ?? value ?? '-';
}

function formatDateTime(value: string | undefined) {
  if (!value) return '-';

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(time);
}

function getTargetTitle(report: AdminReportItem) {
  if (report.targetType === 'REVIEW') {
    return report.targetInfo.bookTitle ? `${report.targetInfo.bookTitle} · 리뷰` : report.targetInfo.title ?? `리뷰 ${report.targetInfo.targetId}`;
  }

  return report.targetInfo.title ?? `도서 ${report.targetInfo.targetId}`;
}

function buildFallbackReportPage(query: AdminReportListQuery): AdminReportPage {
  const keyword = query.q?.trim().toLowerCase();
  const filtered = fallbackReports.filter((report) => {
    const matchesTargetType = query.targetType ? report.targetType === query.targetType : true;
    const matchesStatus = query.status ? report.status === query.status : true;
    const matchesKeyword = keyword
      ? [getTargetTitle(report), report.reporter.name, report.reporter.loginId, report.reportType, report.content].join(' ').toLowerCase().includes(keyword)
      : true;

    return matchesTargetType && matchesStatus && matchesKeyword;
  });

  const page = query.page ?? 0;
  const size = query.size ?? PAGE_SIZE;
  const start = page * size;

  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.max(Math.ceil(filtered.length / size), 1),
    last: start + size >= filtered.length,
  };
}

export function AdminReportListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportsPage, setReportsPage] = useState<AdminReportPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
  const [processReport, setProcessReport] = useState<AdminReportItem | null>(null);
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [processForm, setProcessForm] = useState<ProcessForm>({
    status: 'PROCESSING',
    processResult: '',
    hideReviewYn: false,
    useSanction: false,
    sanctionType: 'WARNING',
    startedAt: '',
    endedAt: '',
    sanctionReason: '',
  });

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const query = useMemo<AdminReportListQuery>(
    () => ({
      targetType: (searchParams.get('targetType') as ReportTargetType | null) || undefined,
      status: (searchParams.get('status') as ReportStatus | null) || undefined,
      q: searchParams.get('q') || undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    }),
    [currentPage, searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadReports() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminReports(query);
        if (!ignore) {
          setReportsPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setReportsPage(buildFallbackReportPage(query));
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 신고 목록을 표시합니다.`);
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
  }, [query]);

  function updateQuery(nextValues: Record<string, string>) {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    setSearchParams(nextParams);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    updateQuery({
      targetType: String(formData.get('targetType') ?? ''),
      status: String(formData.get('status') ?? ''),
      q: String(formData.get('q') ?? '').trim(),
      page: '1',
    });
  }

  function handleReset() {
    setSearchParams({});
  }

  function openProcessModal(report: AdminReportItem, nextStatus: ReportStatus = report.status === 'WAITING' ? 'PROCESSING' : report.status) {
    setProcessReport(report);
    setProcessForm({
      status: nextStatus,
      processResult: '',
      hideReviewYn: false,
      useSanction: false,
      sanctionType: 'WARNING',
      startedAt: '',
      endedAt: '',
      sanctionReason: '',
    });
    setModalError('');
  }

  function closeProcessModal() {
    if (isSaving) return;
    setProcessReport(null);
    setModalError('');
  }

  function updateLocalReport(report: AdminReportItem, payload: AdminReportStatusUpdateRequest) {
    setReportsPage((current) => {
      if (!current) return current;

      return {
        ...current,
        content: current.content.map((item) =>
          item.reportId === report.reportId && item.targetType === report.targetType
            ? {
                ...item,
                status: payload.status,
                processResult: payload.processResult,
                processedAt: new Date().toISOString(),
                managerName: item.managerName && item.managerName !== '-' ? item.managerName : '운영관리자',
                targetInfo: payload.hideReviewYn ? { ...item.targetInfo, reviewStatus: 'HIDDEN' } : item.targetInfo,
              }
            : item,
        ),
      };
    });
  }

  async function handleProcessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!processReport) return;

    const needsResult = processForm.status === 'DONE' || processForm.status === 'REJECTED';

    if (needsResult && !processForm.processResult.trim()) {
      setModalError(processForm.status === 'DONE' ? '처리 결과를 입력해 주세요.' : '반려 사유를 입력해 주세요.');
      return;
    }

    if (processForm.useSanction) {
      if (!processForm.startedAt || !processForm.sanctionReason.trim()) {
        setModalError('제재 시작일과 제재 사유를 입력해 주세요.');
        return;
      }

      if (processForm.endedAt && new Date(processForm.startedAt).getTime() > new Date(processForm.endedAt).getTime()) {
        setModalError('제재 종료일은 시작일보다 빠를 수 없습니다.');
        return;
      }
    }

    const payload: AdminReportStatusUpdateRequest = {
      status: processForm.status,
      processResult: processForm.processResult.trim() || undefined,
      hideReviewYn: processReport.targetType === 'REVIEW' ? processForm.hideReviewYn : undefined,
      sanction: processForm.useSanction
        ? {
            sanctionType: processForm.sanctionType,
            startedAt: processForm.startedAt,
            endedAt: processForm.endedAt || undefined,
            reason: processForm.sanctionReason.trim(),
          }
        : undefined,
    };

    setIsSaving(true);
    setModalError('');

    try {
      await updateAdminReportStatus(processReport.targetType, processReport.reportId, payload);
      updateLocalReport(processReport, payload);
      setStatusMessage('신고 처리가 저장되었습니다.');
      setProcessReport(null);
    } catch (error) {
      updateLocalReport(processReport, payload);
      setStatusMessage('임시 데이터에 신고 처리 상태를 반영했습니다.');
      setProcessReport(null);
    } finally {
      setIsSaving(false);
    }
  }

  const reports = reportsPage?.content ?? [];
  const shownPage = toUiPage(reportsPage?.page);
  const totalPages = reportsPage?.totalPages ?? 1;
  const selectedTargetType = searchParams.get('targetType') ?? '';

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-reports-title">
      <div className={styles.header}>
        <div>
          <span>신고</span>
          <h1 id="admin-reports-title">신고 관리</h1>
        </div>
      </div>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <div className={styles.targetTabs} aria-label="신고 대상 필터">
          <button type="button" className={!selectedTargetType ? styles.activeTargetTab : ''} onClick={() => updateQuery({ targetType: '', page: '1' })}>
            전체
          </button>
          {targetTypeOptions.map((option) => (
            <button type="button" className={selectedTargetType === option.value ? styles.activeTargetTab : ''} key={option.value} onClick={() => updateQuery({ targetType: option.value, page: '1' })}>
              {option.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="targetType" value={selectedTargetType} />
        <label>
          <span className={styles.filterLabelText}>처리 상태</span>
          <select name="status" defaultValue={searchParams.get('status') ?? ''}>
            <option value="">전체</option>
            {statusOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={styles.filterLabelText}>검색어</span>
          <input name="q" type="search" placeholder="신고 제목 또는 대상" defaultValue={searchParams.get('q') ?? ''} />
        </label>
        <div className={styles.filterActions}>
          <Button type="submit">검색</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            초기화
          </Button>
        </div>
      </form>

      {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}
      {statusMessage ? <p className={styles.success}>{statusMessage}</p> : null}

      <div className={styles.contentGrid}>
        <section className={styles.tablePanel} aria-label="신고 목록">
          <div className={styles.tableHeader}>
            <div>
              <h2>신고 목록</h2>
              <p>총 {(reportsPage?.totalElements ?? 0).toLocaleString('ko-KR')}건</p>
            </div>
            <span>
              {shownPage} / {totalPages}
            </span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>신고번호</th>
                  <th>신고자</th>
                  <th>대상유형</th>
                  <th>대상정보</th>
                  <th>신고 사유</th>
                  <th>상태</th>
                  <th>접수일</th>
                  <th>담당자</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9}>신고 목록을 불러오는 중입니다.</td>
                  </tr>
                ) : reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={`${report.targetType}-${report.reportId}`} className={selectedReport?.reportId === report.reportId && selectedReport.targetType === report.targetType ? styles.selectedRow : ''}>
                      <td>RP-{report.reportId}</td>
                      <td>
                        <Link className={styles.memberLink} to={`/admin/members/${report.reporter.memberId}`}>
                          <strong>{report.reporter.loginId}</strong>
                          <span>{report.reporter.name}</span>
                        </Link>
                      </td>
                      <td>{getOptionLabel(targetTypeOptions, report.targetType)}</td>
                      <td>{getTargetTitle(report)}</td>
                      <td>{report.reportType}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${report.status}`]}`}>{getOptionLabel(statusOptions, report.status)}</span>
                      </td>
                      <td>{formatDateTime(report.createdAt)}</td>
                      <td>{report.managerName ?? '-'}</td>
                      <td>
                        <div className={styles.rowActions}>
                          <button type="button" onClick={() => setSelectedReport(report)}>
                            상세보기
                          </button>
                          <button type="button" onClick={() => openProcessModal(report, 'PROCESSING')} disabled={report.status === 'DONE' || report.status === 'REJECTED'}>
                            처리 중
                          </button>
                          <button type="button" onClick={() => openProcessModal(report, 'DONE')} disabled={report.status === 'DONE' || report.status === 'REJECTED'}>
                            완료
                          </button>
                          <button type="button" className={styles.rejectButton} onClick={() => openProcessModal(report, 'REJECTED')} disabled={report.status === 'DONE' || report.status === 'REJECTED'}>
                            반려
                          </button>
                          {report.targetType === 'REVIEW' ? (
                            <button type="button" onClick={() => openProcessModal(report, 'DONE')} disabled={report.status === 'DONE' || report.status === 'REJECTED'}>
                              리뷰 숨김
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9}>신고 내역이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <Button type="button" variant="secondary" disabled={shownPage <= 1} onClick={() => updateQuery({ page: String(shownPage - 1) })}>
              이전
            </Button>
            <span>{shownPage} 페이지</span>
            <Button type="button" variant="secondary" disabled={shownPage >= totalPages} onClick={() => updateQuery({ page: String(shownPage + 1) })}>
              다음
            </Button>
          </div>
        </section>

        <aside className={styles.detailPanel} aria-label="신고 상세">
          {selectedReport ? (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <strong>RP-{selectedReport.reportId}</strong>
                  <h2>{getTargetTitle(selectedReport)}</h2>
                </div>
                <span className={`${styles.statusBadge} ${styles[`status${selectedReport.status}`]}`}>{getOptionLabel(statusOptions, selectedReport.status)}</span>
              </div>
              <dl className={styles.detailList}>
                <div>
                  <dt>대상</dt>
                  <dd>{getOptionLabel(targetTypeOptions, selectedReport.targetType)}</dd>
                </div>
                <div>
                  <dt>신고자</dt>
                  <dd>
                    {selectedReport.reporter.name} / {selectedReport.reporter.loginId}
                  </dd>
                </div>
                <div>
                  <dt>신고 사유</dt>
                  <dd>{selectedReport.reportType}</dd>
                </div>
                <div>
                  <dt>신고 내용</dt>
                  <dd>{selectedReport.content}</dd>
                </div>
                {selectedReport.targetType === 'REVIEW' ? (
                  <div>
                    <dt>원본 리뷰</dt>
                    <dd>{selectedReport.targetInfo.reviewContent ?? '-'}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>처리 결과</dt>
                  <dd>{selectedReport.processResult ?? '-'}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p>상세보기 버튼을 눌러 신고 내용과 원본을 확인하세요.</p>
          )}
        </aside>
      </div>

      {processReport ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeProcessModal}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="report-process-title" onSubmit={handleProcessSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="report-process-title">처리 입력</h2>
                <p>신고번호 RP-{processReport.reportId}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeProcessModal}>
                ×
              </button>
            </div>

            {modalError ? <p className={styles.modalError}>{modalError}</p> : null}

            <label>
              처리 상태
              <select value={processForm.status} onChange={(event) => setProcessForm((current) => ({ ...current, status: event.target.value as ReportStatus }))}>
                {statusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              후속메모
              <textarea rows={6} value={processForm.processResult} placeholder="처리 결과 또는 반려 사유를 입력하세요." onChange={(event) => setProcessForm((current) => ({ ...current, processResult: event.target.value }))} />
            </label>

            {processReport.targetType === 'REVIEW' ? (
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={processForm.hideReviewYn} onChange={(event) => setProcessForm((current) => ({ ...current, hideReviewYn: event.target.checked }))} />
                리뷰 숨김 처리
              </label>
            ) : null}

            <label className={styles.checkLabel}>
              <input type="checkbox" checked={processForm.useSanction} onChange={(event) => setProcessForm((current) => ({ ...current, useSanction: event.target.checked }))} />
              회원 제재 함께 등록
            </label>

            {processForm.useSanction ? (
              <div className={styles.sanctionFields}>
                <label>
                  제재 유형
                  <select value={processForm.sanctionType} onChange={(event) => setProcessForm((current) => ({ ...current, sanctionType: event.target.value as AdminSanctionType }))}>
                    {sanctionTypeOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  시작일
                  <input type="date" value={processForm.startedAt} onChange={(event) => setProcessForm((current) => ({ ...current, startedAt: event.target.value }))} />
                </label>
                <label>
                  종료일
                  <input type="date" value={processForm.endedAt} onChange={(event) => setProcessForm((current) => ({ ...current, endedAt: event.target.value }))} />
                </label>
                <label className={styles.fullField}>
                  제재 사유
                  <textarea rows={3} value={processForm.sanctionReason} placeholder="제재 사유를 입력하세요." onChange={(event) => setProcessForm((current) => ({ ...current, sanctionReason: event.target.value }))} />
                </label>
              </div>
            ) : null}

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={closeProcessModal} disabled={isSaving}>
                취소
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '저장 중' : '처리 저장'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
