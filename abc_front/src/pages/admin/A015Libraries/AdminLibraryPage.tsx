// 도서관 위치 관리(A-015) 화면 — api-spec(final).md API-ADMIN-LIBRARY-001~003 스펙 기준.
// 백엔드 미구현(AdminLibraryController 없음) — 프론트만 스펙대로 미리 준비해둔 상태.
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminBooks } from '../../../api/adminBookApi';
import { getAdminLibraries, updateAdminLibrary, updateAdminLibraryBooks } from '../../../api/adminLibraryApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminBookSummary,
  AdminLibraryBookMapping,
  AdminLibraryHoldingStatus,
  AdminLibraryListQuery,
  AdminLibraryStatus,
  AdminLibrarySummary,
  AdminLibraryUpdateRequest,
  PageResponse,
} from '../../../types/api';
import listStyles from '../../../styles/AdminOpsListPage.module.css';
import styles from '../../../styles/AdminLibraryPage.module.css';

const PAGE_SIZE = 10;

const statusOptions: Array<{ value: AdminLibraryStatus; label: string }> = [
  { value: 'ACTIVE', label: '운영중' },
  { value: 'INACTIVE', label: '비활성' },
];

const holdingStatusOptions: Array<{ value: AdminLibraryHoldingStatus; label: string }> = [
  { value: 'AVAILABLE', label: '보유' },
  { value: 'UNAVAILABLE', label: '미보유' },
];

const fallbackLibraries: AdminLibrarySummary[] = [
  {
    libraryId: 1,
    libraryName: 'ABC 강남점',
    address: '서울특별시 강남구 테헤란로 123',
    latitude: 37.5006,
    longitude: 127.0364,
    status: 'ACTIVE',
    bookCount: 128,
  },
  {
    libraryId: 2,
    libraryName: 'ABC 홍대점',
    address: '서울특별시 마포구 양화로 45',
    latitude: null,
    longitude: null,
    status: 'ACTIVE',
    bookCount: 64,
  },
  {
    libraryId: 3,
    libraryName: 'ABC 부산점',
    address: '부산광역시 해운대구 센텀중앙로 90',
    latitude: 35.1691,
    longitude: 129.1305,
    status: 'INACTIVE',
    bookCount: 12,
  },
];

type LibraryForm = {
  libraryName: string;
  address: string;
  latitude: string;
  longitude: string;
  status: AdminLibraryStatus;
};

type BookChange = AdminLibraryBookMapping & { title: string };

const statusPillClass: Record<AdminLibraryStatus, string> = {
  ACTIVE: listStyles.pillSuccess,
  INACTIVE: listStyles.pillNeutral,
};

function toApiPage(uiPage: number) {
  return Math.max(uiPage - 1, 0);
}

function toUiPage(apiPage: number | undefined) {
  return (apiPage ?? 0) + 1;
}

function getOptionLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T | string | undefined) {
  return options.find((option) => option.value === value)?.label ?? value ?? '-';
}

function formatCoordinate(value: number | null | undefined) {
  return typeof value === 'number' ? value.toFixed(4) : '미등록';
}

function buildFallbackLibraryPage(query: AdminLibraryListQuery): PageResponse<AdminLibrarySummary> {
  const keyword = query.q?.trim().toLowerCase();

  const filtered = fallbackLibraries.filter((library) => {
    const matchesKeyword = keyword
      ? [library.libraryName, library.address].join(' ').toLowerCase().includes(keyword)
      : true;
    const matchesStatus = query.status ? library.status === query.status : true;

    return matchesKeyword && matchesStatus;
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

function getInitialForm(library: AdminLibrarySummary): LibraryForm {
  return {
    libraryName: library.libraryName,
    address: library.address,
    latitude: typeof library.latitude === 'number' ? String(library.latitude) : '',
    longitude: typeof library.longitude === 'number' ? String(library.longitude) : '',
    status: library.status,
  };
}

export function AdminLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [librariesPage, setLibrariesPage] = useState<PageResponse<AdminLibrarySummary> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [editLibrary, setEditLibrary] = useState<AdminLibrarySummary | null>(null);
  const [form, setForm] = useState<LibraryForm | null>(null);
  const [bookChanges, setBookChanges] = useState<BookChange[]>([]);
  const [bookSearchKeyword, setBookSearchKeyword] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<AdminBookSummary[]>([]);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const query = useMemo<AdminLibraryListQuery>(
    () => ({
      q: searchParams.get('q') || undefined,
      status: (searchParams.get('status') as AdminLibraryStatus | null) || undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    }),
    [currentPage, searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadLibraries() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminLibraries(query);
        if (!ignore) {
          setLibrariesPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setLibrariesPage(buildFallbackLibraryPage(query));
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 도서관 목록을 표시합니다.`);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadLibraries();

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
      q: String(formData.get('q') ?? '').trim(),
      status: String(formData.get('status') ?? ''),
      page: '1',
    });
  }

  function handleReset() {
    setSearchParams({});
  }

  function openEditModal(library: AdminLibrarySummary) {
    setEditLibrary(library);
    setForm(getInitialForm(library));
    setBookChanges([]);
    setBookSearchKeyword('');
    setBookSearchResults([]);
    setModalError('');
  }

  function closeEditModal() {
    if (isSaving) return;
    setEditLibrary(null);
    setForm(null);
    setModalError('');
  }

  async function handleBookSearch() {
    const keyword = bookSearchKeyword.trim();
    if (!keyword) return;

    setIsSearchingBooks(true);

    try {
      const data = await getAdminBooks({ q: keyword, page: 0, size: 5 });
      setBookSearchResults(data.content);
    } catch {
      setBookSearchResults([]);
    } finally {
      setIsSearchingBooks(false);
    }
  }

  function addBookChange(book: AdminBookSummary) {
    setBookChanges((current) => {
      if (current.some((item) => item.bookId === book.bookId)) {
        return current;
      }

      return [...current, { bookId: book.bookId, title: book.title, holdingStatus: 'AVAILABLE' }];
    });
  }

  function updateBookChangeStatus(bookId: number, holdingStatus: AdminLibraryHoldingStatus) {
    setBookChanges((current) => current.map((item) => (item.bookId === bookId ? { ...item, holdingStatus } : item)));
  }

  function removeBookChange(bookId: number) {
    setBookChanges((current) => current.filter((item) => item.bookId !== bookId));
  }

  function updateLocalLibrary(libraryId: number, nextLibrary: AdminLibrarySummary) {
    setLibrariesPage((current) =>
      current
        ? {
            ...current,
            content: current.content.map((library) => (library.libraryId === libraryId ? nextLibrary : library)),
          }
        : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editLibrary || !form) return;

    if (!form.libraryName.trim()) {
      setModalError('도서관명을 입력해 주세요.');
      return;
    }

    if (!form.address.trim()) {
      setModalError('주소를 입력해 주세요.');
      return;
    }

    const latitude = form.latitude.trim() ? Number(form.latitude) : null;
    const longitude = form.longitude.trim() ? Number(form.longitude) : null;

    if (form.latitude.trim() && Number.isNaN(latitude)) {
      setModalError('위도는 숫자로 입력해 주세요.');
      return;
    }

    if (form.longitude.trim() && Number.isNaN(longitude)) {
      setModalError('경도는 숫자로 입력해 주세요.');
      return;
    }

    const payload: AdminLibraryUpdateRequest = {
      libraryName: form.libraryName.trim(),
      address: form.address.trim(),
      latitude,
      longitude,
      status: form.status,
    };

    setIsSaving(true);
    setModalError('');

    try {
      await updateAdminLibrary(editLibrary.libraryId, payload);

      if (bookChanges.length > 0) {
        await updateAdminLibraryBooks(editLibrary.libraryId, {
          books: bookChanges.map(({ bookId, holdingStatus }) => ({ bookId, holdingStatus })),
        });
      }

      setStatusMessage('도서관 정보가 저장되었습니다.');
      updateLocalLibrary(editLibrary.libraryId, {
        ...editLibrary,
        ...payload,
        bookCount: editLibrary.bookCount + bookChanges.filter((item) => item.holdingStatus === 'AVAILABLE').length,
      });
      setEditLibrary(null);
      setForm(null);
    } catch (error) {
      setModalError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const libraries = librariesPage?.content ?? [];
  const shownPage = toUiPage(librariesPage?.page);
  const totalPages = Math.max(librariesPage?.totalPages ?? 1, 1);

  return (
    <section className={`page-section ${listStyles.page}`}>
      <div className={listStyles.header}>
        <span>Library</span>
        <h1>도서관 위치 관리</h1>
      </div>

      <form className={listStyles.filterPanel} onSubmit={handleSearch}>
        <label>
          <span className={listStyles.filterLabelText}>검색어</span>
          <input name="q" type="search" defaultValue={searchParams.get('q') ?? ''} placeholder="도서관명, 주소" />
        </label>

        <label>
          <span className={listStyles.filterLabelText}>상태</span>
          <select name="status" defaultValue={searchParams.get('status') ?? ''}>
            <option value="">전체</option>
            {statusOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className={listStyles.filterActions}>
          <Button type="submit">검색</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            초기화
          </Button>
        </div>
      </form>

      {errorMessage ? <p className={listStyles.notice}>{errorMessage}</p> : null}
      {statusMessage ? <p className={listStyles.success}>{statusMessage}</p> : null}

      <div className={listStyles.tablePanel}>
        <div className={listStyles.tableHeader}>
          <h2>도서관 테이블</h2>
          <span>
            전체 {librariesPage?.totalElements.toLocaleString('ko-KR') ?? 0}건 · {shownPage} / {totalPages} 페이지
          </span>
        </div>

        <div className={listStyles.tableWrap}>
          <table className={listStyles.table}>
            <thead>
              <tr>
                <th>도서관번호</th>
                <th>도서관명</th>
                <th>주소</th>
                <th>위도</th>
                <th>경도</th>
                <th>보유 도서 수</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>도서관 목록을 불러오는 중입니다.</td>
                </tr>
              ) : libraries.length > 0 ? (
                libraries.map((library) => (
                  <tr key={library.libraryId}>
                    <td>L-{library.libraryId}</td>
                    <td>{library.libraryName}</td>
                    <td>{library.address}</td>
                    <td>{formatCoordinate(library.latitude)}</td>
                    <td>{formatCoordinate(library.longitude)}</td>
                    <td>{library.bookCount.toLocaleString('ko-KR')}권</td>
                    <td>
                      <span className={`${listStyles.pill} ${statusPillClass[library.status]}`}>
                        {getOptionLabel(statusOptions, library.status)}
                      </span>
                    </td>
                    <td>
                      <div className={listStyles.rowActions}>
                        <button type="button" onClick={() => openEditModal(library)}>
                          수정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>표시할 도서관이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={listStyles.pagination}>
          <Button type="button" variant="secondary" disabled={shownPage <= 1} onClick={() => updateQuery({ page: String(shownPage - 1) })}>
            이전
          </Button>
          <span>{shownPage} 페이지</span>
          <Button type="button" variant="secondary" disabled={shownPage >= totalPages} onClick={() => updateQuery({ page: String(shownPage + 1) })}>
            다음
          </Button>
        </div>
      </div>

      {editLibrary && form ? (
        <div className={listStyles.modalBackdrop} role="presentation" onMouseDown={closeEditModal}>
          <form
            className={listStyles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-edit-title"
            onSubmit={handleSubmit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={listStyles.modalHeader}>
              <div>
                <h2 id="library-edit-title">도서관 정보 수정</h2>
                <p>L-{editLibrary.libraryId}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeEditModal}>
                ×
              </button>
            </div>

            {modalError ? <p className={listStyles.modalError}>{modalError}</p> : null}

            <div className={listStyles.formGrid}>
              <label className={listStyles.fullField}>
                도서관명
                <input
                  value={form.libraryName}
                  onChange={(event) => setForm((current) => (current ? { ...current, libraryName: event.target.value } : current))}
                />
              </label>

              <label className={listStyles.fullField}>
                주소
                <input
                  value={form.address}
                  onChange={(event) => setForm((current) => (current ? { ...current, address: event.target.value } : current))}
                />
              </label>

              <label>
                위도
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="예: 37.5006"
                  value={form.latitude}
                  onChange={(event) => setForm((current) => (current ? { ...current, latitude: event.target.value } : current))}
                />
              </label>
              <label>
                경도
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="예: 127.0364"
                  value={form.longitude}
                  onChange={(event) => setForm((current) => (current ? { ...current, longitude: event.target.value } : current))}
                />
              </label>

              <label className={listStyles.fullField}>
                상태
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => (current ? { ...current, status: event.target.value as AdminLibraryStatus } : current))}
                >
                  {statusOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.bookSection}>
              <h3 className={styles.bookSectionTitle}>보유 도서 변경</h3>

              <div className={styles.bookSearchRow}>
                <input
                  type="search"
                  placeholder="도서 제목으로 검색"
                  value={bookSearchKeyword}
                  onChange={(event) => setBookSearchKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleBookSearch();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => void handleBookSearch()} disabled={isSearchingBooks}>
                  {isSearchingBooks ? '검색 중' : '검색'}
                </Button>
              </div>

              {bookSearchResults.length > 0 ? (
                <div className={styles.bookSearchResults}>
                  {bookSearchResults.map((book) => (
                    <div className={styles.bookSearchResultRow} key={book.bookId}>
                      <span>{book.title}</span>
                      <Button type="button" variant="secondary" onClick={() => addBookChange(book)}>
                        추가
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {bookChanges.length > 0 ? (
                <div className={styles.bookChangeList}>
                  {bookChanges.map((change) => (
                    <div className={styles.bookChangeRow} key={change.bookId}>
                      <span>{change.title}</span>
                      <select
                        value={change.holdingStatus}
                        onChange={(event) => updateBookChangeStatus(change.bookId, event.target.value as AdminLibraryHoldingStatus)}
                      >
                        {holdingStatusOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button type="button" className={styles.bookChangeRemove} onClick={() => removeBookChange(change.bookId)}>
                        제거
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="field-hint">도서를 검색해서 보유 상태 변경분을 추가해 주세요.</p>
              )}
            </div>

            <div className={listStyles.formActions}>
              <Button type="button" variant="secondary" onClick={closeEditModal} disabled={isSaving}>
                취소
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '저장 중' : '저장'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
