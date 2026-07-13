// 관리자 감사 로그(A017) 화면 — 관리자 주요 작업 이력을 조회 전용으로 확인한다. 실제 backend에 연동된다.
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminAuditLogs } from '../../../api/adminAuditLogApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { AdminAuditLogItem, AdminAuditLogPage as AdminAuditLogPageData } from '../../../types/api';
import styles from '../../../styles/AdminOpsListPage.module.css';

const PAGE_SIZE = 10;

function formatDateTime(value: string | undefined) {
  if (!value) return '-';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(time);
}

const fallbackLogs: AdminAuditLogItem[] = [
  {
    auditLogId: 9931,
    adminName: 'admin_kim',
    actionType: '상태 변경',
    targetType: '회원',
    targetId: 1042,
    targetLabel: '회원 #1042',
    beforeValue: 'JOINED',
    afterValue: 'SANCTIONED',
    reason: '도서 리뷰 반복 신고 누적 (신고 #221 연계)',
    createdAt: '2026-07-13T09:12:00',
  },
  {
    auditLogId: 9930,
    adminName: 'admin_kim',
    actionType: '포인트 조정',
    targetType: '회원',
    targetId: 1042,
    targetLabel: '회원 #1042',
    beforeValue: '3,200P',
    afterValue: '3,500P',
    reason: '독서 챌린지 보상 지급',
    createdAt: '2026-07-13T09:10:00',
  },
  {
    auditLogId: 9929,
    adminName: 'admin_park',
    actionType: '쿠폰 발급',
    targetType: '쿠폰',
    targetId: 7,
    targetLabel: '쿠폰 #7',
    beforeValue: '미발급',
    afterValue: '발급 완료 (12건)',
    reason: '여름 이벤트 쿠폰 일괄 발급',
    createdAt: '2026-07-12T17:44:00',
  },
];

function buildFallbackLogPage(query: { actionType?: string; targetType?: string; targetId?: number; page?: number; size?: number }): AdminAuditLogPageData {
  const filtered = fallbackLogs.filter((log) => {
    const matchesAction = query.actionType ? log.actionType === query.actionType : true;
    const matchesTarget = query.targetType ? log.targetType === query.targetType : true;
    const matchesTargetId = query.targetId ? log.targetId === query.targetId : true;
    return matchesAction && matchesTarget && matchesTargetId;
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

function toApiPage(uiPage: number) {
  return Math.max(uiPage - 1, 0);
}

function toUiPage(apiPage: number | undefined) {
  return (apiPage ?? 0) + 1;
}

const actionTypeOptions = ['상태 변경', '포인트 조정', '쿠폰 발급'];
const targetTypeOptions = ['회원', '도서', '쿠폰'];

export function AdminAuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logsPage, setLogsPage] = useState<AdminAuditLogPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [detailLog, setDetailLog] = useState<AdminAuditLogItem | null>(null);

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const query = useMemo(
    () => ({
      actionType: searchParams.get('actionType') || undefined,
      targetType: searchParams.get('targetType') || undefined,
      targetId: searchParams.get('targetId') ? Number(searchParams.get('targetId')) : undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    }),
    [currentPage, searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadLogs() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminAuditLogs(query);
        if (!ignore) setLogsPage(data);
      } catch (error) {
        if (!ignore) {
          setLogsPage(buildFallbackLogPage(query));
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 감사 로그를 표시합니다.`);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadLogs();
    return () => {
      ignore = true;
    };
  }, [query]);

  function updateQuery(nextValues: Record<string, string>) {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    setSearchParams(nextParams);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateQuery({
      actionType: String(formData.get('actionType') ?? ''),
      targetType: String(formData.get('targetType') ?? ''),
      targetId: String(formData.get('targetId') ?? '').trim(),
      page: '1',
    });
  }

  const logs = logsPage?.content ?? [];
  const shownPage = toUiPage(logsPage?.page);
  const totalPages = logsPage?.totalPages ?? 1;

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-audit-logs-title">
      <div className={styles.header}>
        <div>
          <span>감사 로그</span>
          <h1 id="admin-audit-logs-title">관리자 감사 로그</h1>
        </div>
        <div className={styles.apiStrip}>
          <span className={`${styles.apiPill} ${styles.apiPillLive}`}>GET /admin/audit-logs · 실제 연동 (AdminAuditLogController), 조회 전용</span>
        </div>
      </div>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <label>
          <span className={styles.filterLabelText}>작업 유형</span>
          <select name="actionType" defaultValue={searchParams.get('actionType') ?? ''}>
            <option value="">전체</option>
            {actionTypeOptions.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={styles.filterLabelText}>대상 유형</span>
          <select name="targetType" defaultValue={searchParams.get('targetType') ?? ''}>
            <option value="">전체</option>
            {targetTypeOptions.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={styles.filterLabelText}>대상 ID</span>
          <input name="targetId" type="number" placeholder="숫자" defaultValue={searchParams.get('targetId') ?? ''} />
        </label>
        <div className={styles.filterActions}>
          <Button type="submit">검색</Button>
          <Button type="button" variant="secondary" onClick={() => setSearchParams({})}>
            초기화
          </Button>
        </div>
      </form>

      {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}

      <section className={styles.tablePanel} aria-label="감사 로그 목록">
        <div className={styles.tableHeader}>
          <div>
            <h2>감사 로그 목록</h2>
            <p>총 {(logsPage?.totalElements ?? 0).toLocaleString('ko-KR')}건</p>
          </div>
          <span>
            {shownPage} / {totalPages}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>로그번호</th>
                <th>관리자</th>
                <th>작업 유형</th>
                <th>대상</th>
                <th>기록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6}>감사 로그를 불러오는 중입니다.</td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.auditLogId}>
                    <td>L-{log.auditLogId}</td>
                    <td>{log.adminName}</td>
                    <td>
                      <span className={`${styles.pill} ${styles.pillPrimary}`}>{log.actionType}</span>
                    </td>
                    <td>{log.targetLabel ?? `${log.targetType} #${log.targetId}`}</td>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" onClick={() => setDetailLog(log)}>
                          상세보기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>감사 로그가 없습니다.</td>
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

      {detailLog ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setDetailLog(null)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="audit-detail-title">상세</h2>
                <p>L-{detailLog.auditLogId}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={() => setDetailLog(null)}>
                ×
              </button>
            </div>
            <div className={styles.diffRow}>
              <dt>{detailLog.actionType}</dt>
              <dd>
                <span className={styles.diffOld}>{detailLog.beforeValue ?? '-'}</span> → <span className={styles.diffNew}>{detailLog.afterValue ?? '-'}</span>
              </dd>
            </div>
            <div className={styles.diffRow}>
              <dt>사유</dt>
              <dd>{detailLog.reason ?? '-'}</dd>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
