// 공지 관리(A012) 화면 — 공지 목록 조회, 등록, 수정, 숨김을 담당한다 (알림 본문 별도 입력 없음, notifyYn만 전달)
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createAdminNotice, getAdminNotices, updateAdminNotice } from '../../../api/adminNoticeApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { AdminNoticeItem, AdminNoticePage as AdminNoticePageData, AdminNoticeStatus } from '../../../types/api';
import styles from '../../../styles/AdminOpsListPage.module.css';

const PAGE_SIZE = 10;

const statusOptions: Array<{ value: AdminNoticeStatus; label: string }> = [
  { value: 'ACTIVE', label: '게시 중' },
  { value: 'HIDDEN', label: '숨김' },
];

const statusPillClass: Record<AdminNoticeStatus, string> = {
  ACTIVE: styles.pillSuccess,
  HIDDEN: styles.pillNeutral,
};

function getLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T | undefined) {
  return options.find((option) => option.value === value)?.label ?? value ?? '-';
}

function formatDate(value: string | undefined) {
  if (!value) return '-';
  return value.slice(0, 10);
}

type NoticeFormState = { title: string; content: string; status: AdminNoticeStatus; notifyYn: boolean };

const emptyForm: NoticeFormState = { title: '', content: '', status: 'ACTIVE', notifyYn: true };

const fallbackNotices: AdminNoticeItem[] = [
  { noticeId: 118, title: '7월 정기 서버 점검 안내', content: '7월 20일 새벽 2시~4시 서버 점검이 진행됩니다.', status: 'ACTIVE', createdAt: '2026-07-11' },
  { noticeId: 117, title: '여름 독서왕 이벤트 오픈', content: '여름 독서왕 이벤트가 시작되었습니다. 많은 참여 바랍니다.', status: 'ACTIVE', createdAt: '2026-07-05', updatedAt: '2026-07-06' },
  { noticeId: 116, title: '앱 리뉴얼 사전 안내 (종료)', content: '앱 리뉴얼 관련 안내는 종료되었습니다.', status: 'HIDDEN', createdAt: '2026-06-20', updatedAt: '2026-07-01' },
];

function buildFallbackNoticePage(query: { status?: AdminNoticeStatus; page?: number; size?: number }): AdminNoticePageData {
  const filtered = fallbackNotices.filter((notice) => (query.status ? notice.status === query.status : true));

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

export function AdminNoticePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [noticesPage, setNoticesPage] = useState<AdminNoticePageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [editingNotice, setEditingNotice] = useState<AdminNoticeItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<NoticeFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const query = useMemo(
    () => ({
      status: (searchParams.get('status') as AdminNoticeStatus | null) || undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    }),
    [currentPage, searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadNotices() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminNotices(query);
        if (!ignore) setNoticesPage(data);
      } catch (error) {
        if (!ignore) {
          setNoticesPage(buildFallbackNoticePage(query));
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 공지 목록을 표시합니다.`);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadNotices();

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
    updateQuery({ status: String(formData.get('status') ?? ''), page: '1' });
  }

  function startCreate() {
    setIsCreating(true);
    setEditingNotice(null);
    setForm(emptyForm);
  }

  function startEdit(notice: AdminNoticeItem) {
    setIsCreating(false);
    setEditingNotice(notice);
    setForm({ title: notice.title, content: notice.content, status: notice.status, notifyYn: false });
  }

  async function persistNotice(payload: NoticeFormState, targetId: number | null) {
    if (targetId) {
      const saved = await updateAdminNotice(targetId, payload);
      return saved;
    }
    const saved = await createAdminNotice(payload);
    return saved;
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setStatusMessage('제목과 내용은 필수입니다.');
      return;
    }

    setIsSaving(true);
    const targetId = editingNotice?.noticeId ?? null;

    try {
      const saved = await persistNotice(form, targetId);
      setStatusMessage(targetId ? '공지가 수정되었습니다.' : '공지가 등록되었습니다.');
      setNoticesPage((current) => {
        if (!current) return current;
        if (targetId) {
          return { ...current, content: current.content.map((notice) => (notice.noticeId === targetId ? saved : notice)) };
        }
        return { ...current, content: [saved, ...current.content], totalElements: current.totalElements + 1 };
      });
    } catch (error) {
      setStatusMessage(`${getApiErrorMessage(error)} 화면에는 임시로 반영했습니다.`);
      setNoticesPage((current) => {
        if (!current) return current;
        if (targetId) {
          return {
            ...current,
            content: current.content.map((notice) => (notice.noticeId === targetId ? { ...notice, title: form.title, content: form.content, status: form.status, updatedAt: new Date().toISOString() } : notice)),
          };
        }
        const draft: AdminNoticeItem = { noticeId: Date.now(), title: form.title, content: form.content, status: form.status, createdAt: new Date().toISOString() };
        return { ...current, content: [draft, ...current.content], totalElements: current.totalElements + 1 };
      });
    } finally {
      setIsSaving(false);
      setIsCreating(false);
      setEditingNotice(null);
      setForm(emptyForm);
    }
  }

  async function handleHide(notice: AdminNoticeItem) {
    const payload: NoticeFormState = { title: notice.title, content: notice.content, status: 'HIDDEN', notifyYn: false };

    try {
      const saved = await updateAdminNotice(notice.noticeId, payload);
      setNoticesPage((current) => (current ? { ...current, content: current.content.map((item) => (item.noticeId === notice.noticeId ? saved : item)) } : current));
      setStatusMessage('공지를 숨김 처리했습니다.');
    } catch (error) {
      setNoticesPage((current) =>
        current ? { ...current, content: current.content.map((item) => (item.noticeId === notice.noticeId ? { ...item, status: 'HIDDEN' as const } : item)) } : current,
      );
      setStatusMessage(`${getApiErrorMessage(error)} 화면에는 임시로 반영했습니다.`);
    }
  }

  const notices = noticesPage?.content ?? [];
  const shownPage = toUiPage(noticesPage?.page);
  const totalPages = noticesPage?.totalPages ?? 1;
  const isEditing = isCreating || editingNotice !== null;

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-notices-title">
      <div className={styles.header}>
        <div>
          <span>공지</span>
          <h1 id="admin-notices-title">공지 관리</h1>
        </div>
        <div className={styles.apiStrip}>
          <span className={styles.apiPill}>GET/POST/PUT /admin/notices · controller 미구현 → mock/fallback</span>
        </div>
      </div>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <label>
          <span className={styles.filterLabelText}>상태</span>
          <select name="status" defaultValue={searchParams.get('status') ?? ''}>
            <option value="">전체</option>
            {statusOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.filterActions}>
          <Button type="submit">검색</Button>
          <Button type="button" onClick={startCreate}>
            + 공지 등록
          </Button>
        </div>
      </form>

      {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}
      {statusMessage ? <p className={styles.success}>{statusMessage}</p> : null}

      <div className={`${styles.contentGrid} ${styles.withDetail}`}>
        <section className={styles.tablePanel} aria-label="공지 목록">
          <div className={styles.tableHeader}>
            <div>
              <h2>공지 목록</h2>
              <p>총 {(noticesPage?.totalElements ?? 0).toLocaleString('ko-KR')}건</p>
            </div>
            <span>
              {shownPage} / {totalPages}
            </span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>공지번호</th>
                  <th>제목</th>
                  <th>상태</th>
                  <th>작성일</th>
                  <th>수정일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6}>공지 목록을 불러오는 중입니다.</td>
                  </tr>
                ) : notices.length > 0 ? (
                  notices.map((notice) => (
                    <tr key={notice.noticeId}>
                      <td>N-{notice.noticeId}</td>
                      <td>{notice.title}</td>
                      <td>
                        <span className={`${styles.pill} ${statusPillClass[notice.status]}`}>{getLabel(statusOptions, notice.status)}</span>
                      </td>
                      <td>{formatDate(notice.createdAt)}</td>
                      <td>{formatDate(notice.updatedAt)}</td>
                      <td>
                        <div className={styles.rowActions}>
                          <button type="button" onClick={() => startEdit(notice)}>
                            수정
                          </button>
                          <button type="button" onClick={() => handleHide(notice)} disabled={notice.status === 'HIDDEN'}>
                            숨김
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>등록된 공지가 없습니다.</td>
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

        <aside className={styles.detailPanel} aria-label="공지 작성/수정">
          {isEditing ? (
            <form onSubmit={handleFormSubmit}>
              <div className={styles.detailHeader}>
                <h2>{isCreating ? '공지 등록' : `공지 수정 · N-${editingNotice?.noticeId}`}</h2>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.fullField}>
                  제목
                  <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
                </label>
                <label className={styles.fullField}>
                  내용
                  <textarea rows={5} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} required />
                </label>
                <label>
                  상태
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AdminNoticeStatus }))}>
                    {statusOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {isCreating ? (
                  <label>
                    <span>&nbsp;</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                      <input type="checkbox" style={{ width: 18, height: 18 }} checked={form.notifyYn} onChange={(event) => setForm((current) => ({ ...current, notifyYn: event.target.checked }))} />
                      회원에게 알림 발송
                    </span>
                  </label>
                ) : null}
              </div>
              <div className={styles.formActions}>
                <Button type="button" variant="secondary" onClick={() => { setIsCreating(false); setEditingNotice(null); }} disabled={isSaving}>
                  취소
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? '저장 중' : isCreating ? '등록' : '저장'}
                </Button>
              </div>
            </form>
          ) : (
            <p className={styles.emptyHint}>
              목록에서 <strong>수정</strong>을 클릭하거나
              <br />
              <strong>+ 공지 등록</strong>을 클릭하세요.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
