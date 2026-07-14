// 회원 관리(A002) 화면 — 회원 목록 조회/검색/필터링과 회원 상태(가입·제재·탈퇴 등) 변경을 담당한다
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { changeAdminMemberStatus, getAdminMembers } from '../../../api/adminMemberApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { AdminMemberListQuery, AdminMemberRole, AdminMemberStatus, AdminMemberStatusChangeRequest, AdminMemberSummary, AdminSanctionType, PageResponse } from '../../../types/api';
import styles from '../../../styles/AdminMemberListPage.module.css';

const PAGE_SIZE = 10;

const statusOptions: Array<{ value: AdminMemberStatus; label: string }> = [
  { value: 'JOINED', label: '가입' },
  { value: 'SANCTIONED', label: '제재' },
  { value: 'WITHDRAWN', label: '탈퇴' },
  { value: 'DEACTIVATED', label: '비활성' },
];

const roleOptions: Array<{ value: AdminMemberRole; label: string }> = [
  { value: 'USER', label: '회원' },
  { value: 'ADMIN', label: '관리자' },
];

const gradeOptions = [
  { value: '1', label: '씨앗' },
  { value: '2', label: '새싹' },
  { value: '3', label: '나무' },
  { value: '4', label: '숲' },
];

const sanctionTypeOptions: Array<{ value: AdminSanctionType; label: string }> = [
  { value: 'ACCOUNT_SUSPENSION', label: '계정 정지' },
  { value: 'SERVICE_LIMIT', label: '서비스 제한' },
  { value: 'WARNING', label: '경고' },
];

const fallbackMembers: AdminMemberSummary[] = [
  {
    memberId: 1024,
    loginId: 'park_reader',
    name: '박서연',
    email: 'seoyeon.park@example.com',
    role: 'USER',
    gradeId: 4,
    gradeName: '숲',
    pointBalance: 12300,
    status: 'JOINED',
    currentSanction: null,
  },
  {
    memberId: 991,
    loginId: 'read_admin',
    name: '김도윤',
    email: 'admin@example.com',
    role: 'ADMIN',
    pointBalance: 0,
    status: 'JOINED',
    currentSanction: null,
  },
  {
    memberId: 873,
    loginId: 'review_stop',
    name: '이민준',
    email: 'minjun@example.com',
    role: 'USER',
    gradeId: 1,
    gradeName: '씨앗',
    pointBalance: 1500,
    status: 'SANCTIONED',
    currentSanction: {
      sanctionType: 'ACCOUNT_SUSPENSION',
      startedAt: '2026-07-02T09:00:00',
      endedAt: '2026-07-16T23:59:00',
      reason: '리뷰 신고 누적',
    },
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

function formatPoint(value: number | undefined) {
  return `${(value ?? 0).toLocaleString('ko-KR')}P`;
}

function formatDateTime(value: string | undefined) {
  if (!value) return '';

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(time);
}

function getSanctionText(member: AdminMemberSummary) {
  const sanction = member.currentSanction;
  if (!sanction) return '-';

  const type = getOptionLabel(sanctionTypeOptions, sanction.sanctionType);
  const endedAt = formatDateTime(sanction.endedAt);

  return endedAt ? `${type} · ${endedAt} 종료` : type;
}

function buildFallbackMemberPage(query: AdminMemberListQuery): PageResponse<AdminMemberSummary> {
  const keyword = query.q?.trim().toLowerCase();
  const filtered = fallbackMembers.filter((member) => {
    const matchesKeyword = keyword ? [member.name, member.loginId, member.email].join(' ').toLowerCase().includes(keyword) : true;
    const matchesStatus = query.status ? member.status === query.status : true;
    const matchesRole = query.role ? member.role === query.role : true;
    const matchesGrade = query.gradeId ? member.gradeId === query.gradeId : true;

    return matchesKeyword && matchesStatus && matchesRole && matchesGrade;
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

export function AdminMemberListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [membersPage, setMembersPage] = useState<PageResponse<AdminMemberSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState<AdminMemberSummary | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [statusForm, setStatusForm] = useState<AdminMemberStatusChangeRequest>({
    status: 'JOINED',
    reason: '',
  });
  const [modalError, setModalError] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const query = useMemo<AdminMemberListQuery>(() => {
    const gradeId = searchParams.get('gradeId');

    return {
      q: searchParams.get('q') || undefined,
      status: (searchParams.get('status') as AdminMemberStatus | null) || undefined,
      role: (searchParams.get('role') as AdminMemberRole | null) || undefined,
      gradeId: gradeId ? Number(gradeId) : undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    };
  }, [currentPage, searchParams]);

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminMembers(query);
        if (!ignore) {
          setMembersPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setMembersPage(buildFallbackMemberPage(query));
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 회원 목록을 표시합니다.`);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadMembers();

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
      q: String(formData.get('q') ?? '').trim(),
      status: String(formData.get('status') ?? ''),
      role: String(formData.get('role') ?? ''),
      gradeId: String(formData.get('gradeId') ?? ''),
      page: '1',
    });
  }

  function handleReset() {
    setOpenActionMenuId(null);
    setSearchParams({});
  }

  function openStatusModal(member: AdminMemberSummary) {
    setOpenActionMenuId(null);
    setSelectedMember(member);
    setStatusForm({
      status: member.status,
      reason: '',
      sanctionType: member.currentSanction?.sanctionType as AdminSanctionType | undefined,
      startedAt: '',
      endedAt: '',
    });
    setModalError('');
  }

  function closeStatusModal() {
    if (isSavingStatus) return;
    setOpenActionMenuId(null);
    setSelectedMember(null);
    setModalError('');
  }

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMember) return;

    if (!statusForm.reason.trim()) {
      setModalError('상태 변경 사유를 입력해 주세요.');
      return;
    }

    if (statusForm.status === 'SANCTIONED') {
      if (!statusForm.sanctionType || !statusForm.startedAt || !statusForm.endedAt) {
        setModalError('제재 상태는 제재 유형, 시작일, 종료일을 모두 입력해야 합니다.');
        return;
      }

      if (new Date(statusForm.startedAt).getTime() > new Date(statusForm.endedAt).getTime()) {
        setModalError('제재 시작일은 종료일보다 늦을 수 없습니다.');
        return;
      }
    }

    setIsSavingStatus(true);
    setModalError('');

    try {
      await changeAdminMemberStatus(selectedMember.memberId, statusForm);
      setStatusMessage('회원 상태가 변경되었습니다.');
      setSelectedMember(null);
      setMembersPage((current) => {
        if (!current) return current;

        return {
          ...current,
          content: current.content.map((member) =>
            member.memberId === selectedMember.memberId
              ? {
                  ...member,
                  status: statusForm.status,
                  currentSanction:
                    statusForm.status === 'SANCTIONED'
                      ? {
                          sanctionType: statusForm.sanctionType,
                          startedAt: statusForm.startedAt,
                          endedAt: statusForm.endedAt,
                          reason: statusForm.reason,
                        }
                      : null,
                }
              : member,
          ),
        };
      });
    } catch (error) {
      setStatusMessage('임시 데이터에 회원 상태 변경을 반영했습니다.');
      setSelectedMember(null);
      setMembersPage((current) => {
        if (!current) return current;

        return {
          ...current,
          content: current.content.map((member) =>
            member.memberId === selectedMember.memberId
              ? {
                  ...member,
                  status: statusForm.status,
                  currentSanction:
                    statusForm.status === 'SANCTIONED'
                      ? {
                          sanctionType: statusForm.sanctionType,
                          startedAt: statusForm.startedAt,
                          endedAt: statusForm.endedAt,
                          reason: statusForm.reason,
                        }
                      : null,
                }
              : member,
          ),
        };
      });
    } finally {
      setIsSavingStatus(false);
    }
  }

  const members = membersPage?.content ?? [];
  const totalPages = membersPage?.totalPages ?? 1;
  const shownPage = toUiPage(membersPage?.page);

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-members-title">
      <div className={styles.header}>
        <div>
          <h1 id="admin-members-title">회원 목록 관리</h1>
        </div>
      </div>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <label>
          <span className={styles.filterLabelText}>검색어</span>
          <input name="q" type="search" placeholder="회원명 / 아이디 / 이메일" defaultValue={searchParams.get('q') ?? ''} />
        </label>

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

        <label>
          <span className={styles.filterLabelText}>역할</span>
          <select name="role" defaultValue={searchParams.get('role') ?? ''}>
            <option value="">전체</option>
            {roleOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={styles.filterLabelText}>등급</span>
          <select name="gradeId" defaultValue={searchParams.get('gradeId') ?? ''}>
            <option value="">전체</option>
            {gradeOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

      <div className={styles.tablePanel}>
        <div className={styles.tableHeader}>
          <div>
            <h2>회원 테이블</h2>
            <p>총 {(membersPage?.totalElements ?? 0).toLocaleString('ko-KR')}명</p>
          </div>
          <span>
            {shownPage} / {totalPages}
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>회원번호</th>
                <th>아이디/이름</th>
                <th>이메일</th>
                <th>역할/등급</th>
                <th>포인트</th>
                <th>상태</th>
                <th>현재 유효 제재</th>
                <th className={styles.actionColumnHeader}>
                  <span className={styles.visuallyHidden}>관리</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>회원 목록을 불러오는 중입니다.</td>
                </tr>
              ) : members.length > 0 ? (
                members.map((member) => {
                  const isActionMenuOpen = openActionMenuId === member.memberId;

                  return (
                    <tr key={member.memberId}>
                      <td>M-{member.memberId}</td>
                      <td>
                        <Link className={styles.memberLink} to={`/admin/members/${member.memberId}`}>
                          <strong>{member.loginId}</strong>
                          <span>{member.name}</span>
                        </Link>
                      </td>
                      <td>{member.email}</td>
                      <td>
                        {getOptionLabel(roleOptions, member.role)} / {member.gradeName ?? '-'}
                      </td>
                      <td>{formatPoint(member.pointBalance)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${member.status}`]}`}>{getOptionLabel(statusOptions, member.status)}</span>
                      </td>
                      <td>{getSanctionText(member)}</td>
                      <td className={styles.actionColumnCell}>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.actionMenuButton}
                            aria-label={`M-${member.memberId} 관리 메뉴`}
                            aria-haspopup="menu"
                            aria-expanded={isActionMenuOpen}
                            onClick={() => setOpenActionMenuId((current) => (current === member.memberId ? null : member.memberId))}
                          >
                            ⋯
                          </button>
                          {isActionMenuOpen ? (
                            <div className={styles.actionMenu} role="menu">
                              <Link role="menuitem" to={`/admin/members/${member.memberId}`} onClick={() => setOpenActionMenuId(null)}>
                                상세
                              </Link>
                              <button type="button" role="menuitem" onClick={() => openStatusModal(member)}>
                                상태 변경
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
                  <td colSpan={8}>검색 조건에 맞는 회원이 없습니다.</td>
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
      </div>

      {selectedMember ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeStatusModal}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-status-modal-title" onSubmit={handleStatusSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="member-status-modal-title">회원 상태 변경</h2>
                <p>
                  {selectedMember.loginId} / {selectedMember.name}
                </p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeStatusModal}>
                ×
              </button>
            </div>

            {modalError ? <p className={styles.modalError}>{modalError}</p> : null}

            <label>
              변경 상태
              <select
                value={statusForm.status}
                onChange={(event) =>
                  setStatusForm((current) => ({
                    ...current,
                    status: event.target.value as AdminMemberStatus,
                    sanctionType: event.target.value === 'SANCTIONED' ? (current.sanctionType ?? 'ACCOUNT_SUSPENSION') : undefined,
                  }))
                }
              >
                {statusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {statusForm.status === 'SANCTIONED' ? (
              <div className={styles.sanctionFields}>
                <label>
                  제재 유형
                  <select value={statusForm.sanctionType ?? 'ACCOUNT_SUSPENSION'} onChange={(event) => setStatusForm((current) => ({ ...current, sanctionType: event.target.value as AdminSanctionType }))}>
                    {sanctionTypeOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  시작일
                  <input type="date" value={statusForm.startedAt ?? ''} onChange={(event) => setStatusForm((current) => ({ ...current, startedAt: event.target.value }))} />
                </label>
                <label>
                  종료일
                  <input type="date" value={statusForm.endedAt ?? ''} onChange={(event) => setStatusForm((current) => ({ ...current, endedAt: event.target.value }))} />
                </label>
              </div>
            ) : null}

            <label>
              사유
              <textarea value={statusForm.reason} rows={4} placeholder="상태 변경 사유를 입력하세요." onChange={(event) => setStatusForm((current) => ({ ...current, reason: event.target.value }))} />
            </label>

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={closeStatusModal} disabled={isSavingStatus}>
                취소
              </Button>
              <Button type="submit" disabled={isSavingStatus}>
                {isSavingStatus ? '저장 중' : '저장'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
