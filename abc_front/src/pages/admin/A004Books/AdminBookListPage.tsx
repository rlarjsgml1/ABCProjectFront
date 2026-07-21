import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { changeAdminBookStatus, getAdminBooks } from '../../../api/adminBookApi';
import { getCategories } from '../../../api/bookApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminBookListQuery,
  AdminBookRentalType,
  AdminBookStatus,
  AdminBookStatusChangeRequest,
  AdminBookSummary,
  Category,
  PageResponse,
} from '../../../types/api';
import styles from '../../../styles/AdminBookListPage.module.css';

const PAGE_SIZE = 10;

const rentalTypeOptions: Array<{ value: AdminBookRentalType; label: string }> = [
  { value: 'FREE', label: '무료' },
  { value: 'PAID', label: '유료' },
];

const statusOptions: Array<{ value: AdminBookStatus; label: string }> = [
  { value: 'AVAILABLE', label: '이용 가능' },
  { value: 'HIDDEN', label: '숨김' },
  { value: 'INACTIVE', label: '비활성' },
];

const fallbackCategories: Category[] = [
  { categoryId: 1, name: '소설' },
  { categoryId: 2, name: '경제 / 경영' },
  { categoryId: 3, name: '인문 / 사회 / 역사' },
  { categoryId: 4, name: '컴퓨터 / IT' },
  { categoryId: 5, name: '자기계발' },
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

function getAuthorText(book: AdminBookSummary) {
  return book.authorNames.length ? book.authorNames.join(', ') : '-';
}

function getPublisherText(book: AdminBookSummary) {
  return book.publisherName || '-';
}

function getCategoryText(book: AdminBookSummary) {
  return book.categories.length ? book.categories.map((category) => category.categoryName).join(', ') : '-';
}

function formatPrice(book: AdminBookSummary) {
  if (book.rentalType === 'FREE') {
    return '무료';
  }

  return `${book.rentalPrice.toLocaleString('ko-KR')}원`;
}

function flattenCategories(categories: Category[]): Category[] {
  return categories.flatMap((category) => [category, ...(category.children ? flattenCategories(category.children) : [])]);
}

export function AdminBookListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [booksPage, setBooksPage] = useState<PageResponse<AdminBookSummary> | null>(null);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<AdminBookSummary | null>(null);
  const [statusForm, setStatusForm] = useState<AdminBookStatusChangeRequest>({
    status: 'AVAILABLE',
    reason: '',
  });
  const [modalError, setModalError] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const query = useMemo<AdminBookListQuery>(() => {
    const categoryId = searchParams.get('categoryId');

    return {
      q: searchParams.get('q') || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      rentalType: (searchParams.get('rentalType') as AdminBookRentalType | null) || undefined,
      status: (searchParams.get('status') as AdminBookStatus | null) || undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    };
  }, [currentPage, searchParams]);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (!ignore) {
          setCategories(data.length ? flattenCategories(data) : fallbackCategories);
        }
      } catch {
        if (!ignore) {
          setCategories(fallbackCategories);
        }
      }
    }

    void loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadBooks() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminBooks(query);
        if (!ignore) {
          setBooksPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setBooksPage(null);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadBooks();

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
      categoryId: String(formData.get('categoryId') ?? ''),
      rentalType: String(formData.get('rentalType') ?? ''),
      status: String(formData.get('status') ?? ''),
      page: '1',
    });
  }

  function handleReset() {
    setOpenActionMenuId(null);
    setSearchParams({});
  }

  function openStatusModal(book: AdminBookSummary) {
    setOpenActionMenuId(null);
    setSelectedBook(book);
    setStatusForm({
      status: book.status,
      reason: '',
    });
    setModalError('');
  }

  function closeStatusModal() {
    if (isSavingStatus) return;
    setSelectedBook(null);
    setModalError('');
  }

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBook) return;

    const isActualChange = statusForm.status !== selectedBook.status;

    if (isActualChange && !statusForm.reason?.trim()) {
      setModalError('상태 변경 사유를 입력해 주세요.');
      return;
    }

    setIsSavingStatus(true);
    setModalError('');

    try {
      await changeAdminBookStatus(selectedBook.bookId, statusForm);
      setStatusMessage('도서 상태가 변경되었습니다.');
      setSelectedBook(null);

      const refreshed = await getAdminBooks(query);
      setBooksPage(refreshed);
    } catch (error) {
      setModalError(getApiErrorMessage(error));
    } finally {
      setIsSavingStatus(false);
    }
  }

  const books = booksPage?.content ?? [];
  const shownPage = toUiPage(booksPage?.page);
  const totalPages = Math.max(booksPage?.totalPages ?? 1, 1);

  return (
    <section className={`page-section ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Member</span>
          <h1>도서 목록 관리</h1>
        </div>

        <Link className="button button-primary" to="/admin/books/new">
          신규도서등록
        </Link>
      </div>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <label>
          <span className={styles.filterLabelText}>검색어</span>
          <input name="q" type="search" defaultValue={searchParams.get('q') ?? ''} placeholder="제목, 저자, 출판사, ISBN" />
        </label>

        <label>
          <span className={styles.filterLabelText}>카테고리</span>
          <select name="categoryId" defaultValue={searchParams.get('categoryId') ?? ''}>
            <option value="">전체</option>
            {categories.map((category) => (
              <option value={category.categoryId} key={category.categoryId}>
                {category.name || category.categoryName}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={styles.filterLabelText}>대여 유형</span>
          <select name="rentalType" defaultValue={searchParams.get('rentalType') ?? ''}>
            <option value="">전체</option>
            {rentalTypeOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            <h2>도서테이블</h2>
          </div>
          <span>
            전체 {booksPage?.totalElements.toLocaleString('ko-KR') ?? 0}건 · {shownPage} / {totalPages} 페이지
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>도서번호</th>
                <th>제목</th>
                <th>저자</th>
                <th>출판사</th>
                <th>ISBN</th>
                <th>카테고리</th>
                <th>유형</th>
                <th>가격</th>
                <th>상태</th>
                <th className={styles.actionColumnHeader}>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10}>도서 목록을 불러오는 중입니다.</td>
                </tr>
              ) : books.length > 0 ? (
                books.map((book) => {
                  const isActionMenuOpen = openActionMenuId === book.bookId;

                  return (
                    <tr key={book.bookId}>
                      <td>B-{book.bookId}</td>
                      <td>
                        <Link className={styles.bookTitleLink} to={`/admin/books/${book.bookId}/edit`}>{book.title}</Link>
                      </td>
                      <td>{getAuthorText(book)}</td>
                      <td>{getPublisherText(book)}</td>
                      <td>{book.isbn || '-'}</td>
                      <td>{getCategoryText(book)}</td>
                      <td>
                        <span className={`${styles.rentalBadge} ${styles[`rental${book.rentalType}`]}`}>
                          {getOptionLabel(rentalTypeOptions, book.rentalType)}
                        </span>
                      </td>
                      <td>{formatPrice(book)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${book.status}`]}`}>
                          {getOptionLabel(statusOptions, book.status)}
                        </span>
                      </td>
                      <td className={styles.actionColumnCell}>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.actionMenuButton}
                            aria-label={`B-${book.bookId} 관리 메뉴`}
                            aria-haspopup="menu"
                            aria-expanded={isActionMenuOpen}
                            onClick={() => setOpenActionMenuId((current) => (current === book.bookId ? null : book.bookId))}
                          >
                            ⋯
                          </button>
                          {isActionMenuOpen ? (
                            <div className={styles.actionMenu} role="menu">
                              <Link role="menuitem" to={`/admin/books/${book.bookId}/edit`} onClick={() => setOpenActionMenuId(null)}>
                                수정
                              </Link>
                              <button type="button" role="menuitem" onClick={() => openStatusModal(book)}>
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
                  <td colSpan={10}>{errorMessage ? '도서 목록을 불러오지 못했습니다.' : '표시할 도서가 없습니다.'}</td>
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

      {selectedBook ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeStatusModal}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="book-status-modal-title" onSubmit={handleStatusSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="book-status-modal-title">도서 상태 변경</h2>
                <p>
                  B-{selectedBook.bookId} / {selectedBook.title}
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
                    status: event.target.value as AdminBookStatus,
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

            <label>
              변경 사유
              <textarea
                value={statusForm.reason}
                onChange={(event) =>
                  setStatusForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="상태를 변경하는 사유를 입력해 주세요."
              />
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
