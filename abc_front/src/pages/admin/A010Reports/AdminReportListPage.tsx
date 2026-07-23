// 신고 관리(A010) 화면 — 도서/리뷰 신고 목록 조회와 처리 상태 변경(완료/반려/제재 등록)을 담당한다
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAdminReports, updateAdminReportStatus } from '../../../api/adminReportApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { AdminReportItem, AdminReportListQuery, AdminReportPage, AdminReportStatusUpdateRequest, ReportStatus, ReportTargetType } from '../../../types/api';
import styles from '../../../styles/AdminReportListPage.module.css';

const PAGE_SIZE = 10;

type ProcessForm = {
  status: ReportStatus;
  processResult: string;
  hideReviewYn: boolean;
  useSanction: boolean;
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

const allowedNextStatusMap: Partial<Record<ReportStatus, ReportStatus[]>> = {
  WAITING: ['PROCESSING', 'DONE', 'REJECTED'],
  PROCESSING: ['DONE', 'REJECTED'],
};

function getAllowedNextStatusOptions(status: ReportStatus) {
  const allowedStatuses = allowedNextStatusMap[status] ?? [];
  return statusOptions.filter((option) => allowedStatuses.includes(option.value));
}

function toStartDateTime(date: string) {
  return `${date}T00:00:00`;
}

function toEndDateTime(date: string) {
  return `${date}T23:59:59`;
}

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
    return report.bookTitle ? `${report.bookTitle} · 리뷰` : `리뷰 #${report.reviewId ?? '-'}`;
  }

  return report.bookTitle ?? `도서 #${report.bookId ?? '-'}`;
}

export function AdminReportListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportsPage, setReportsPage] = useState<AdminReportPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
  const [processReport, setProcessReport] = useState<AdminReportItem | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [processForm, setProcessForm] = useState<ProcessForm>({
    status: 'PROCESSING',
    processResult: '',
    hideReviewYn: false,
    useSanction: false,
    startedAt: '',
    endedAt: '',
    sanctionReason: '',
  });

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  // 백엔드 GET /admin/reports는 검색어(q) 파라미터를 지원하지 않는다 — q는 아래에서 현재 페이지 결과에 클라이언트 필터로만 적용한다.
  const query = useMemo<AdminReportListQuery>(
    () => ({
      targetType: (searchParams.get('targetType') as ReportTargetType | null) || undefined,
      status: (searchParams.get('status') as ReportStatus | null) || undefined,
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
    setOpenActionMenuId(null);

    const formData = new FormData(event.currentTarget);
    updateQuery({
      targetType: String(formData.get('targetType') ?? ''),
      status: String(formData.get('status') ?? ''),
      q: String(formData.get('q') ?? '').trim(),
      page: '1',
    });
  }

  function handleReset() {
    setOpenActionMenuId(null);
    setSearchParams({});
  }

  function openProcessModal(report: AdminReportItem, nextStatus?: ReportStatus) {
    const allowedStatusOptions = getAllowedNextStatusOptions(report.status);
    const initialStatus =
      nextStatus && allowedStatusOptions.some((option) => option.value === nextStatus)
        ? nextStatus
        : allowedStatusOptions[0]?.value;

    if (!initialStatus) return;

    setOpenActionMenuId(null);
    setProcessReport(report);
    setProcessForm({
      status: initialStatus,
      processResult: '',
      hideReviewYn: false,
      useSanction: false,
      startedAt: '',
      endedAt: '',
      sanctionReason: '',
    });
    setModalError('');
  }

  function closeProcessModal() {
    if (isSaving) return;
    setOpenActionMenuId(null);
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
    const canApplyReviewAction = processReport.targetType === 'REVIEW' && processForm.status === 'DONE';

    if (needsResult && !processForm.processResult.trim()) {
      setModalError(processForm.status === 'DONE' ? '처리 결과를 입력해 주세요.' : '반려 사유를 입력해 주세요.');
      return;
    }

    if (canApplyReviewAction && processForm.useSanction) {
      if (!processForm.startedAt || !processForm.sanctionReason.trim()) {
        setModalError('제재 시작일과 제재 사유를 입력해 주세요.');
        return;
      }

      if (
        processForm.endedAt &&
        new Date(toEndDateTime(processForm.endedAt)).getTime() <=
          new Date(toStartDateTime(processForm.startedAt)).getTime()
      ) {
        setModalError('제재 종료일은 시작일보다 빠를 수 없습니다.');
        return;
      }
    }

    const payload: AdminReportStatusUpdateRequest = {
      status: processForm.status,
      processResult: processForm.processResult.trim() || undefined,
      hideReviewYn: canApplyReviewAction ? processForm.hideReviewYn : undefined,
      sanction: canApplyReviewAction && processForm.useSanction
        ? {
            startedAt: toStartDateTime(processForm.startedAt),
            endedAt: processForm.endedAt ? toEndDateTime(processForm.endedAt) : undefined,
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
      setModalError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const searchKeyword = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const reports = (reportsPage?.content ?? []).filter((report) =>
    searchKeyword
      ? [report.reporterName, report.bookTitle, report.reportType, report.content].some((field) =>
          field?.toLowerCase().includes(searchKeyword),
        )
      : true,
  );
  const shownPage = toUiPage(reportsPage?.page);
  const totalPages = reportsPage?.totalPages ?? 1;
  const selectedTargetType = searchParams.get('targetType') ?? '';
  const allowedProcessStatusOptions = processReport ? getAllowedNextStatusOptions(processReport.status) : [];
  const canApplyReviewAction = processReport?.targetType === 'REVIEW' && processForm.status === 'DONE';

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
                  <th className={styles.actionColumnHeader}>
                    <span className={styles.visuallyHidden}>액션</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8}>신고 목록을 불러오는 중입니다.</td>
                  </tr>
                ) : errorMessage ? (
                  <tr>
                    <td colSpan={8}>신고 목록을 불러오지 못했습니다.</td>
                  </tr>
                ) : reports.length > 0 ? (
                  reports.map((report) => {
                    const reportKey = `${report.targetType}-${report.reportId}`;
                    const isActionLocked = report.status === 'DONE' || report.status === 'REJECTED';
                    const isActionMenuOpen = openActionMenuId === reportKey;

                    return (
                      <tr key={reportKey} className={selectedReport?.reportId === report.reportId && selectedReport.targetType === report.targetType ? styles.selectedRow : ''}>
                        <td>RP-{report.reportId}</td>
                        <td>
                          <Link className={styles.memberLink} to={`/admin/members/${report.reporterId}`}>
                            {report.reporterName}
                          </Link>
                        </td>
                        <td className={styles.actionColumnCell}>{getOptionLabel(targetTypeOptions, report.targetType)}</td>
                        <td>{getTargetTitle(report)}</td>
                        <td>{report.reportType}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status${report.status}`]}`}>{getOptionLabel(statusOptions, report.status)}</span>
                        </td>
                        <td>{formatDateTime(report.createdAt)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.actionMenuButton}
                              aria-label={`RP-${report.reportId} 액션 메뉴`}
                              aria-haspopup="menu"
                              aria-expanded={isActionMenuOpen}
                              onClick={() => setOpenActionMenuId((current) => (current === reportKey ? null : reportKey))}
                            >
                              ⋯
                            </button>
                            {isActionMenuOpen ? (
                              <div className={styles.actionMenu} role="menu">
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setOpenActionMenuId(null);
                                  }}
                                >
                                  상세보기
                                </button>
                                <button type="button" role="menuitem" onClick={() => openProcessModal(report)} disabled={isActionLocked}>
                                  처리
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

      </div>

      {selectedReport ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setSelectedReport(null)}>
          <section className={`${styles.modal} ${styles.detailModal}`} role="dialog" aria-modal="true" aria-labelledby="report-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="report-detail-title">신고 상세</h2>
                <p>RP-{selectedReport.reportId}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={() => setSelectedReport(null)}>
                ×
              </button>
            </div>
            <div className={styles.detailHeader}>
              <div>
                <strong>{getOptionLabel(targetTypeOptions, selectedReport.targetType)}</strong>
                <h3>{getTargetTitle(selectedReport)}</h3>
              </div>
              <span className={`${styles.statusBadge} ${styles[`status${selectedReport.status}`]}`}>{getOptionLabel(statusOptions, selectedReport.status)}</span>
            </div>
            <dl className={styles.detailList}>
              <div>
                <dt>신고자</dt>
                <dd>{selectedReport.reporterName}</dd>
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
                  <dd>{selectedReport.reviewContent ?? '-'}</dd>
                </div>
              ) : null}
              <div>
                <dt>처리 결과</dt>
                <dd>{selectedReport.processResult ?? '-'}</dd>
              </div>
            </dl>
            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setSelectedReport(null)}>
                닫기
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const report = selectedReport;
                  setSelectedReport(null);
                  openProcessModal(report);
                }}
                disabled={selectedReport.status === 'DONE' || selectedReport.status === 'REJECTED'}
              >
                처리
              </Button>
            </div>
          </section>
        </div>
      ) : null}

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
              <select
                value={processForm.status}
                onChange={(event) => {
                  const status = event.target.value as ReportStatus;
                  setProcessForm((current) => ({
                    ...current,
                    status,
                    hideReviewYn: status === 'DONE' ? current.hideReviewYn : false,
                    useSanction: status === 'DONE' ? current.useSanction : false,
                    startedAt: status === 'DONE' ? current.startedAt : '',
                    endedAt: status === 'DONE' ? current.endedAt : '',
                    sanctionReason: status === 'DONE' ? current.sanctionReason : '',
                  }));
                }}
              >
                {allowedProcessStatusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              후속메모
              <textarea
                rows={6}
                value={processForm.processResult}
                placeholder="처리 결과 또는 반려 사유를 입력하세요."
                onChange={(event) =>
                  setProcessForm((current) => ({
                    ...current,
                    processResult: event.target.value,
                  }))
                }
              />
            </label>

            {canApplyReviewAction ? (
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={processForm.hideReviewYn}
                  onChange={(event) =>
                    setProcessForm((current) => ({
                      ...current,
                      hideReviewYn: event.target.checked,
                    }))
                  }
                />
                리뷰 숨김 처리
              </label>
            ) : null}

            {canApplyReviewAction ? (
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={processForm.useSanction}
                  onChange={(event) =>
                    setProcessForm((current) => ({
                      ...current,
                      useSanction: event.target.checked,
                    }))
                  }
                />
                회원 제재 함께 등록
              </label>
            ) : null}

            {canApplyReviewAction && processForm.useSanction ? (
              <div className={styles.sanctionFields}>
                <p className="field-hint">제재 유형: 계정 정지 (이 API가 지원하는 유일한 제재 유형)</p>
                <label>
                  시작일
                  <input
                    type="date"
                    value={processForm.startedAt}
                    onChange={(event) =>
                      setProcessForm((current) => ({
                        ...current,
                        startedAt: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  종료일
                  <input
                    type="date"
                    value={processForm.endedAt}
                    onChange={(event) =>
                      setProcessForm((current) => ({
                        ...current,
                        endedAt: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className={styles.fullField}>
                  제재 사유
                  <textarea
                    rows={3}
                    value={processForm.sanctionReason}
                    placeholder="제재 사유를 입력하세요."
                    onChange={(event) =>
                      setProcessForm((current) => ({
                        ...current,
                        sanctionReason: event.target.value,
                      }))
                    }
                  />
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
