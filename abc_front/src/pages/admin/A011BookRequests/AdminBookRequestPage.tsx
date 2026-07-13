import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAdminBookRequestCandidates, updateAdminBookRequestCandidateStatus } from '../../../api/adminBookRequestApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminBookRequestCandidate,
  AdminBookRequestCandidatePage,
  AdminBookRequestCandidateQuery,
  AdminBookRequestStatusUpdateRequest,
  BookRequestStatus,
} from '../../../types/api';
import styles from '../../../styles/AdminBookRequestPage.module.css';

const PAGE_SIZE = 10;

const statusOptions: Array<{ value: BookRequestStatus; label: string }> = [
  { value: 'REQUESTED', label: '신청' },
  { value: 'IN_REVIEW', label: '검토 중' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
];

const fallbackCandidates: AdminBookRequestCandidate[] = [
  {
    candidateId: 1101,
    title: '데이터베이스 첫걸음',
    author: '박서연',
    publisher: '아콘출판',
    status: 'REQUESTED',
    requestCount: 3,
    firstRequestedAt: '2026-07-08T09:20:00',
    latestRequestedAt: '2026-07-12T14:30:00',
    applicants: [
      { memberId: 1024, loginId: 'park_reader', name: '박서연', reason: '수업 참고서로 필요합니다.', requestedAt: '2026-07-08T09:20:00' },
      { memberId: 1091, loginId: 'data_study', name: '김도윤', reason: '데이터베이스 입문 도서를 희망합니다.', requestedAt: '2026-07-10T11:10:00' },
      { memberId: 1133, loginId: 'book_note', name: '이하린', reason: '스터디 추천 도서입니다.', requestedAt: '2026-07-12T14:30:00' },
    ],
  },
  {
    candidateId: 1102,
    title: '리액트 운영 패턴',
    author: '정민재',
    publisher: '프론트북스',
    status: 'IN_REVIEW',
    requestCount: 1,
    firstRequestedAt: '2026-07-06T16:05:00',
    applicants: [{ memberId: 1188, loginId: 'ui_dev', name: '문하늘', reason: '프로젝트 화면 구현에 참고하고 싶습니다.', requestedAt: '2026-07-06T16:05:00' }],
  },
  {
    candidateId: 1103,
    title: '클린 코드 실전편',
    author: '로버트 C. 마틴',
    publisher: '위키북스',
    status: 'REJECTED',
    requestCount: 2,
    firstRequestedAt: '2026-07-01T13:40:00',
    applicants: [
      { memberId: 1204, loginId: 'clean_dev', name: '오지후', reason: '개발 역량 강화를 위해 신청합니다.', requestedAt: '2026-07-01T13:40:00' },
      { memberId: 1217, loginId: 'code_habit', name: '한유진', reason: '소장 희망합니다.', requestedAt: '2026-07-02T10:22:00' },
    ],
    rejectReason: '동일 주제 최신 도서가 이미 보유되어 있습니다.',
  },
];

type ReviewForm = {
  status: BookRequestStatus;
  approvedBookId: string;
  rejectReason: string;
};

function toApiPage(uiPage: number) {
  return Math.max(uiPage - 1, 0);
}

function toUiPage(apiPage: number | undefined) {
  return (apiPage ?? 0) + 1;
}

function formatDate(value: string | undefined) {
  if (!value) return '-';

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
  }).format(time);
}

function getStatusLabel(value: BookRequestStatus | string | undefined) {
  return statusOptions.find((option) => option.value === value)?.label ?? value ?? '-';
}

function getRepresentativeApplicant(candidate: AdminBookRequestCandidate) {
  return candidate.applicants[0];
}

function buildFallbackPage(query: AdminBookRequestCandidateQuery): AdminBookRequestCandidatePage {
  const keyword = query.q?.trim().toLowerCase();
  const filtered = fallbackCandidates.filter((candidate) => {
    const matchesStatus = query.status ? candidate.status === query.status : true;
    const matchesKeyword = keyword
      ? [candidate.title, candidate.author, candidate.publisher, ...candidate.applicants.flatMap((applicant) => [applicant.name, applicant.loginId])]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      : true;

    return matchesStatus && matchesKeyword;
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

export function AdminBookRequestPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidatesPage, setCandidatesPage] = useState<AdminBookRequestCandidatePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<AdminBookRequestCandidate | null>(null);
  const [reviewCandidate, setReviewCandidate] = useState<AdminBookRequestCandidate | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({ status: 'IN_REVIEW', approvedBookId: '', rejectReason: '' });
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const query = useMemo<AdminBookRequestCandidateQuery>(
    () => ({
      status: (searchParams.get('status') as BookRequestStatus | null) || undefined,
      q: searchParams.get('q') || undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    }),
    [currentPage, searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadCandidates() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminBookRequestCandidates(query);
        if (!ignore) {
          setCandidatesPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setCandidatesPage(buildFallbackPage(query));
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 희망도서 목록을 표시합니다.`);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadCandidates();

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
      status: String(formData.get('status') ?? ''),
      q: String(formData.get('q') ?? '').trim(),
      page: '1',
    });
  }

  function handleReset() {
    setSearchParams({});
  }

  function updateLocalCandidate(candidateId: number, payload: AdminBookRequestStatusUpdateRequest) {
    setCandidatesPage((current) => {
      if (!current) return current;

      return {
        ...current,
        content: current.content.map((candidate) =>
          candidate.candidateId === candidateId
            ? {
                ...candidate,
                status: payload.status,
                approvedBookId: payload.approvedBookId ?? candidate.approvedBookId,
                rejectReason: payload.rejectReason ?? candidate.rejectReason,
              }
            : candidate,
        ),
      };
    });

    setSelectedCandidate((current) =>
      current?.candidateId === candidateId
        ? {
            ...current,
            status: payload.status,
            approvedBookId: payload.approvedBookId ?? current.approvedBookId,
            rejectReason: payload.rejectReason ?? current.rejectReason,
          }
        : current,
    );
  }

  function openReviewModal(candidate: AdminBookRequestCandidate, status: BookRequestStatus) {
    setReviewCandidate(candidate);
    setReviewForm({
      status,
      approvedBookId: candidate.approvedBookId ? String(candidate.approvedBookId) : '',
      rejectReason: candidate.rejectReason ?? '',
    });
    setModalError('');
  }

  function closeReviewModal() {
    if (isSaving) return;
    setReviewCandidate(null);
    setModalError('');
  }

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewCandidate) return;

    if (reviewForm.status === 'REJECTED' && !reviewForm.rejectReason.trim()) {
      setModalError('반려 사유를 입력해 주세요.');
      return;
    }

    const approvedBookId = reviewForm.approvedBookId ? Number(reviewForm.approvedBookId) : undefined;
    if (approvedBookId !== undefined && (!Number.isInteger(approvedBookId) || approvedBookId <= 0)) {
      setModalError('승인도서 번호는 숫자로 입력해 주세요.');
      return;
    }

    const payload: AdminBookRequestStatusUpdateRequest = {
      status: reviewForm.status,
      approvedBookId: reviewForm.status === 'APPROVED' ? approvedBookId : undefined,
      rejectReason: reviewForm.status === 'REJECTED' ? reviewForm.rejectReason.trim() : undefined,
    };

    setIsSaving(true);
    setModalError('');

    try {
      await updateAdminBookRequestCandidateStatus(reviewCandidate.candidateId, payload);
      updateLocalCandidate(reviewCandidate.candidateId, payload);
      setStatusMessage('희망도서 처리 상태가 저장되었습니다.');
      setReviewCandidate(null);
    } catch (error) {
      updateLocalCandidate(reviewCandidate.candidateId, payload);
      setStatusMessage('임시 데이터에 처리 상태를 반영했습니다.');
      setReviewCandidate(null);
    } finally {
      setIsSaving(false);
    }
  }

  const candidates = candidatesPage?.content ?? [];
  const shownPage = toUiPage(candidatesPage?.page);
  const totalPages = candidatesPage?.totalPages ?? 1;

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-book-requests-title">
      <header className={styles.header}>
        <span>희망도서</span>
        <h1 id="admin-book-requests-title">희망도서 관리</h1>
      </header>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <label>
          <span className={styles.filterLabelText}>신청 상태</span>
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
          <span className={styles.filterLabelText}>도서명/신청자</span>
          <input name="q" type="search" placeholder="도서명, 신청자, 아이디" defaultValue={searchParams.get('q') ?? ''} />
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
        <section className={styles.tablePanel} aria-label="희망도서 후보 목록">
          <div className={styles.tableHeader}>
            <div>
              <h2>희망도서 테이블</h2>
              <p>총 {(candidatesPage?.totalElements ?? 0).toLocaleString('ko-KR')}건</p>
            </div>
            <span>
              {shownPage} / {totalPages}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>신청번호</th>
                  <th>신청자</th>
                  <th>도서명</th>
                  <th>저자</th>
                  <th>출판사</th>
                  <th>신청사유</th>
                  <th>신청상태</th>
                  <th>반려사유</th>
                  <th>승인도서 번호</th>
                  <th>신청일</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11}>희망도서 목록을 불러오는 중입니다.</td>
                  </tr>
                ) : candidates.length > 0 ? (
                  candidates.map((candidate) => {
                    const applicant = getRepresentativeApplicant(candidate);
                    const isClosed = candidate.status === 'APPROVED' || candidate.status === 'REJECTED';

                    return (
                      <tr key={candidate.candidateId} className={selectedCandidate?.candidateId === candidate.candidateId ? styles.selectedRow : ''}>
                        <td>BR-{candidate.candidateId}</td>
                        <td>
                          <button type="button" className={styles.linkButton} onClick={() => setSelectedCandidate(candidate)}>
                            <strong>{applicant?.name ?? '-'}</strong>
                            <span>{candidate.requestCount > 1 ? `외 ${candidate.requestCount - 1}명` : applicant?.loginId ?? '-'}</span>
                          </button>
                        </td>
                        <td>{candidate.title}</td>
                        <td>{candidate.author}</td>
                        <td>{candidate.publisher}</td>
                        <td>{applicant?.reason ?? '-'}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status${candidate.status}`]}`}>{getStatusLabel(candidate.status)}</span>
                        </td>
                        <td>{candidate.rejectReason ?? '-'}</td>
                        <td>{candidate.approvedBookId ? `B-${candidate.approvedBookId}` : '-'}</td>
                        <td>{formatDate(candidate.firstRequestedAt)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button type="button" onClick={() => setSelectedCandidate(candidate)}>
                              상세
                            </button>
                            <button type="button" onClick={() => openReviewModal(candidate, 'IN_REVIEW')} disabled={isClosed}>
                              검토 시작
                            </button>
                            <Link to={`/admin/books/new?candidateId=${candidate.candidateId}`}>도서 등록</Link>
                            <button type="button" onClick={() => openReviewModal(candidate, 'APPROVED')} disabled={isClosed}>
                              승인
                            </button>
                            <button type="button" className={styles.rejectButton} onClick={() => openReviewModal(candidate, 'REJECTED')} disabled={isClosed}>
                              반려
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11}>희망도서 신청 내역이 없습니다.</td>
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

        <aside className={styles.detailPanel} aria-label="희망도서 상세">
          {selectedCandidate ? (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <strong>BR-{selectedCandidate.candidateId}</strong>
                  <h2>{selectedCandidate.title}</h2>
                </div>
                <span className={`${styles.statusBadge} ${styles[`status${selectedCandidate.status}`]}`}>{getStatusLabel(selectedCandidate.status)}</span>
              </div>
              <dl className={styles.detailList}>
                <div>
                  <dt>저자/출판사</dt>
                  <dd>
                    {selectedCandidate.author} / {selectedCandidate.publisher}
                  </dd>
                </div>
                <div>
                  <dt>신청자</dt>
                  <dd>{selectedCandidate.applicants.map((applicant) => `${applicant.name}(${applicant.loginId})`).join(', ')}</dd>
                </div>
                <div>
                  <dt>신청 사유</dt>
                  <dd>{selectedCandidate.applicants.map((applicant) => applicant.reason).filter(Boolean).join(' / ') || '-'}</dd>
                </div>
                <div>
                  <dt>최초 신청일</dt>
                  <dd>{formatDate(selectedCandidate.firstRequestedAt)}</dd>
                </div>
                <div>
                  <dt>승인도서 번호</dt>
                  <dd>{selectedCandidate.approvedBookId ? `B-${selectedCandidate.approvedBookId}` : '-'}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p>상세 버튼을 눌러 신청자와 신청 사유를 확인하세요.</p>
          )}
        </aside>
      </div>

      {reviewCandidate ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeReviewModal}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="book-request-review-title" onSubmit={handleReviewSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="book-request-review-title">처리 입력</h2>
                <p>신청번호 BR-{reviewCandidate.candidateId}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeReviewModal}>
                ×
              </button>
            </div>

            {modalError ? <p className={styles.modalError}>{modalError}</p> : null}

            <label>
              처리 상태
              <select value={reviewForm.status} onChange={(event) => setReviewForm((current) => ({ ...current, status: event.target.value as BookRequestStatus }))}>
                {statusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {reviewForm.status === 'APPROVED' ? (
              <label>
                승인도서 번호
                <input type="number" min="1" value={reviewForm.approvedBookId} placeholder="도서 등록 후 생성된 번호" onChange={(event) => setReviewForm((current) => ({ ...current, approvedBookId: event.target.value }))} />
              </label>
            ) : null}

            {reviewForm.status === 'REJECTED' ? (
              <label>
                반려사유
                <textarea rows={5} value={reviewForm.rejectReason} placeholder="사용자에게 안내할 반려 사유를 입력하세요." onChange={(event) => setReviewForm((current) => ({ ...current, rejectReason: event.target.value }))} />
              </label>
            ) : null}

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={closeReviewModal} disabled={isSaving}>
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
