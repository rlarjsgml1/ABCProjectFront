import { FormEvent, useEffect, useState } from 'react';
import {
  createAdminCollection,
  getAdminCollectionDetail,
  getAdminCollections,
  patchAdminCollection,
  saveAdminCollection,
  saveAdminCollectionBooks,
} from '../../../api/adminCollectionApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminCollectionBookItem,
  AdminCollectionDetail,
  AdminCollectionItem,
  AdminCollectionListQuery,
  AdminCollectionSaveRequest,
  AdminCollectionStatus,
  AdminCollectionType,
  PageResponse,
} from '../../../types/api';
import styles from '../../../styles/AdminCollectionPage.module.css';

const PAGE_SIZE = 10;

const typeOptions: Array<{ value: AdminCollectionType; label: string }> = [
  { value: 'SERIES', label: '시리즈' },
  { value: 'EVENT', label: '이벤트' },
];

const statusOptions: Array<{ value: AdminCollectionStatus; label: string }> = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'HIDDEN', label: '숨김' },
  { value: 'ENDED', label: '종료' },
];

function toApiPage(uiPage: number) {
  return Math.max(uiPage - 1, 0);
}

function toUiPage(apiPage: number | undefined) {
  return (apiPage ?? 0) + 1;
}

function getTypeLabel(type: AdminCollectionType | undefined) {
  return typeOptions.find((option) => option.value === type)?.label ?? '-';
}

function getStatusLabel(status: AdminCollectionStatus | undefined) {
  return statusOptions.find((option) => option.value === status)?.label ?? '-';
}

function formatPeriod(collection: AdminCollectionItem) {
  if (!collection.startDate && !collection.endDate) return '-';
  return `${collection.startDate ?? '-'} ~ ${collection.endDate ?? '-'}`;
}

const emptyCollectionForm = {
  name: '',
  collectionType: 'EVENT' as AdminCollectionType,
  discountRate: 0,
  description: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE' as AdminCollectionStatus,
};

export function AdminCollectionPage() {
  const [collectionsPage, setCollectionsPage] = useState<PageResponse<AdminCollectionItem> | null>(null);
  const [query, setQuery] = useState<AdminCollectionListQuery>({ page: 0, size: PAGE_SIZE });
  const [refreshToken, setRefreshToken] = useState(0);
  const [summary, setSummary] = useState({ total: 0, active: 0, hidden: 0, ended: 0 });
  const [editingCollection, setEditingCollection] = useState<AdminCollectionDetail | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bookManageCollection, setBookManageCollection] = useState<AdminCollectionItem | null>(null);
  const [managedBooks, setManagedBooks] = useState<AdminCollectionBookItem[]>([]);
  const [originalManagedBookIds, setOriginalManagedBookIds] = useState<number[]>([]);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBooks, setIsSavingBooks] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modalError, setModalError] = useState('');
  const [bookModalError, setBookModalError] = useState('');

  const shownPage = toUiPage(collectionsPage?.page);
  const totalPages = Math.max(collectionsPage?.totalPages ?? 1, 1);
  const collections = collectionsPage?.content ?? [];
  const formMode = isCreateModalOpen ? 'create' : editingCollection ? 'edit' : null;
  const formDefaults = editingCollection ?? emptyCollectionForm;

  useEffect(() => {
    let ignore = false;

    async function loadCollections() {
      setIsLoading(true);
      setNoticeMessage('');

      try {
        const data = await getAdminCollections(query);
        if (!ignore) {
          setCollectionsPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setCollectionsPage(null);
          setNoticeMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadCollections();

    return () => {
      ignore = true;
    };
  }, [query, refreshToken]);

  // 검색·필터와 무관하게 상태별 전체 건수를 반영하기 위해 목록 조회와 별도로 status별 totalElements만 가져온다.
  useEffect(() => {
    let ignore = false;

    async function loadSummary() {
      const [totalResult, activeResult, hiddenResult, endedResult] = await Promise.allSettled([
        getAdminCollections({ page: 0, size: 1 }),
        getAdminCollections({ status: 'ACTIVE', page: 0, size: 1 }),
        getAdminCollections({ status: 'HIDDEN', page: 0, size: 1 }),
        getAdminCollections({ status: 'ENDED', page: 0, size: 1 }),
      ]);

      if (ignore) return;

      setSummary({
        total: totalResult.status === 'fulfilled' ? totalResult.value.totalElements : 0,
        active: activeResult.status === 'fulfilled' ? activeResult.value.totalElements : 0,
        hidden: hiddenResult.status === 'fulfilled' ? hiddenResult.value.totalElements : 0,
        ended: endedResult.status === 'fulfilled' ? endedResult.value.totalElements : 0,
      });
    }

    void loadSummary();

    return () => {
      ignore = true;
    };
  }, [refreshToken]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setQuery({
      collectionType: (String(formData.get('collectionType') ?? '') || undefined) as AdminCollectionType | undefined,
      status: (String(formData.get('status') ?? '') || undefined) as AdminCollectionStatus | undefined,
      page: 0,
      size: PAGE_SIZE,
    });
  }

  function handleReset() {
    setQuery({ page: 0, size: PAGE_SIZE });
  }

  function openCreateModal() {
    setEditingCollection(null);
    setIsCreateModalOpen(true);
    setModalError('');
  }

  async function openEditModal(collection: AdminCollectionItem) {
    setIsCreateModalOpen(false);
    setNoticeMessage('');

    try {
      const detail = await getAdminCollectionDetail(collection.collectionId);
      setEditingCollection(detail);
      setModalError('');
    } catch (error) {
      // 상세 조회 실패 시 모달을 열지 않는다 — 모달이 안 열리면 modalError가 화면에 보이지 않으므로
      // 페이지 상단 noticeMessage로 알린다.
      setNoticeMessage(getApiErrorMessage(error));
    }
  }

  function closeEditModal() {
    if (isSaving) return;
    setIsCreateModalOpen(false);
    setEditingCollection(null);
    setModalError('');
  }

  async function openBookModal(collection: AdminCollectionItem) {
    setBookManageCollection(collection);
    setNewBookTitle('');
    setBookModalError('');

    try {
      const detail = await getAdminCollectionDetail(collection.collectionId);
      const sortedBooks = [...detail.books].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      setManagedBooks(sortedBooks);
      setOriginalManagedBookIds(sortedBooks.map((book) => book.bookId));
    } catch (error) {
      setBookModalError(getApiErrorMessage(error));
      setManagedBooks([]);
      setOriginalManagedBookIds([]);
    }
  }

  function closeBookModal() {
    if (isSavingBooks) return;
    setBookManageCollection(null);
    setManagedBooks([]);
    setOriginalManagedBookIds([]);
    setBookModalError('');
  }

  async function handleSaveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('collectionName') ?? '').trim();
    const collectionType = String(formData.get('collectionType') ?? 'EVENT') as AdminCollectionType;
    const status = String(formData.get('status') ?? 'ACTIVE') as AdminCollectionStatus;
    const discountRate = Number(formData.get('discountRate') ?? 0);
    const startDate = String(formData.get('startDate') ?? '').trim();
    const endDate = String(formData.get('endDate') ?? '').trim();

    if (!name) {
      setModalError('컬렉션명을 입력해 주세요.');
      return;
    }

    if (discountRate < 0 || discountRate > 100) {
      setModalError('할인율은 0부터 100 사이로 입력해 주세요.');
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setModalError('시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }

    const payload: AdminCollectionSaveRequest = {
      name,
      collectionType,
      discountRate,
      description: String(formData.get('description') ?? '').trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status,
    };

    setIsSaving(true);
    setModalError('');

    try {
      if (editingCollection) {
        await saveAdminCollection(editingCollection.collectionId, payload);
      } else {
        await createAdminCollection(payload);
      }
      setSuccessMessage(editingCollection ? '컬렉션이 저장되었습니다.' : '컬렉션이 등록되었습니다.');
      setRefreshToken((token) => token + 1);
      setIsCreateModalOpen(false);
      setEditingCollection(null);
    } catch (error) {
      setModalError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePatchStatus(collection: AdminCollectionItem, status: AdminCollectionStatus) {
    setNoticeMessage('');

    try {
      await patchAdminCollection(collection.collectionId, { status });
      setSuccessMessage('컬렉션 상태가 변경되었습니다.');
      setRefreshToken((token) => token + 1);
    } catch (error) {
      setNoticeMessage(getApiErrorMessage(error));
    }
  }

  function addManagedBook() {
    // 실제 도서 번호 검색 연동이 없어 이 입력만으로는 실존 도서를 특정할 수 없다 — 가짜 bookId로
    // 저장을 시도하면 실제 서버에서 반드시 실패하므로 여기서 명확히 안내하고 목록에 추가하지 않는다.
    setBookModalError('도서 추가는 실제 도서 번호 검색 연동이 없어 이 화면에서 지원되지 않습니다. 도서 목록 관리 화면에서 등록된 도서 번호를 확인해 주세요.');
  }

  function removeManagedBook(bookId: number) {
    setManagedBooks((current) => current.filter((book) => book.bookId !== bookId));
  }

  function updateManagedBookOrder(bookId: number, displayOrder: number) {
    setManagedBooks((current) =>
      current.map((book) =>
        book.bookId === bookId
          ? {
              ...book,
              displayOrder: Number(displayOrder) || 1,
            }
          : book,
      ),
    );
  }

  async function handleSaveBooks() {
    if (!bookManageCollection) return;

    const currentBookIds = new Set(managedBooks.map((book) => book.bookId));
    const removeBookIds = originalManagedBookIds.filter((bookId) => !currentBookIds.has(bookId));

    const sortedBooks = [...managedBooks].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const hasDuplicateOrder =
      bookManageCollection.collectionType === 'SERIES' &&
      new Set(sortedBooks.map((book) => book.displayOrder)).size !== sortedBooks.length;

    if (hasDuplicateOrder) {
      setBookModalError('표시 순서가 중복되지 않게 입력해 주세요.');
      return;
    }

    setIsSavingBooks(true);
    setBookModalError('');

    try {
      if (removeBookIds.length > 0) {
        await patchAdminCollection(bookManageCollection.collectionId, { removeBookIds });
      }

      if (sortedBooks.length > 0) {
        await saveAdminCollectionBooks(bookManageCollection.collectionId, {
          books: sortedBooks.map((book) => ({
            bookId: book.bookId,
            displayOrder: bookManageCollection.collectionType === 'SERIES' ? book.displayOrder : undefined,
          })),
        });
      }

      setSuccessMessage('컬렉션 도서 구성이 저장되었습니다.');
      setRefreshToken((token) => token + 1);
      setBookManageCollection(null);
      setManagedBooks([]);
      setOriginalManagedBookIds([]);
    } catch (error) {
      setBookModalError(getApiErrorMessage(error));
    } finally {
      setIsSavingBooks(false);
    }
  }

  return (
    <section className={`page-section ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Collection</span>
          <h1>컬렉션 관리</h1>
          <p>시리즈와 이벤트 컬렉션, 컬렉션에 포함될 도서 묶음을 관리합니다.</p>
        </div>

        <Button type="button" onClick={openCreateModal}>
          컬렉션 등록
        </Button>
      </div>

      <section className={styles.summaryPanel}>
        <h2>컬렉션 요약</h2>
        <div className={styles.summaryGrid}>
          <article>
            <span>전체 컬렉션</span>
            <strong>{summary.total}개</strong>
          </article>
          <article>
            <span>노출 컬렉션</span>
            <strong>{summary.active}개</strong>
          </article>
          <article>
            <span>숨김 컬렉션</span>
            <strong>{summary.hidden}개</strong>
          </article>
          <article>
            <span>종료 컬렉션</span>
            <strong>{summary.ended}개</strong>
          </article>
        </div>
      </section>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <label>
          검색어
          <input name="q" type="search" placeholder="컬렉션명, 설명" disabled title="백엔드가 컬렉션 검색어 필터를 지원하지 않습니다." />
        </label>
        <label>
          컬렉션 유형
          <select name="collectionType" defaultValue={query.collectionType ?? ''}>
            <option value="">전체</option>
            {typeOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          상태
          <select name="status" defaultValue={query.status ?? ''}>
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

      {noticeMessage ? <p className={styles.notice}>{noticeMessage}</p> : null}
      {successMessage ? <p className={styles.success}>{successMessage}</p> : null}

      <section className={styles.tablePanel}>
        <div className={styles.tableHeader}>
          <h2>컬렉션 테이블</h2>
          <span>
            전체 {collectionsPage?.totalElements.toLocaleString('ko-KR') ?? 0}건 · {shownPage} / {totalPages} 페이지
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>컬렉션번호</th>
                <th>컬렉션명</th>
                <th>구분</th>
                <th>기간</th>
                <th>할인율</th>
                <th>등록 도서 수</th>
                <th>표시 순서</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9}>컬렉션 목록을 불러오는 중입니다.</td>
                </tr>
              ) : collections.length > 0 ? (
                collections.map((collection) => (
                  <tr key={collection.collectionId}>
                    <td>C-{collection.collectionId}</td>
                    <td className={styles.titleCell}>
                      <strong>{collection.name}</strong>
                      <small>-</small>
                    </td>
                    <td>{getTypeLabel(collection.collectionType)}</td>
                    <td>{formatPeriod(collection)}</td>
                    <td>{collection.discountRate ? `${collection.discountRate}%` : '-'}</td>
                    <td>{collection.mappedCount.toLocaleString('ko-KR')}</td>
                    <td>-</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status${collection.status}`]}`}>
                        {getStatusLabel(collection.status)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button type="button" variant="secondary" onClick={() => openEditModal(collection)}>
                          수정
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => openBookModal(collection)}>
                          도서 관리
                        </Button>
                        <Button
                          type="button"
                          variant={collection.status === 'ACTIVE' ? 'danger' : 'secondary'}
                          onClick={() => handlePatchStatus(collection, collection.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE')}
                        >
                          {collection.status === 'ACTIVE' ? '숨김' : '노출'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>표시할 컬렉션이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <Button type="button" variant="secondary" disabled={shownPage <= 1} onClick={() => setQuery((current) => ({ ...current, page: toApiPage(shownPage - 1) }))}>
            이전
          </Button>
          <span>{shownPage} 페이지</span>
          <Button type="button" variant="secondary" disabled={shownPage >= totalPages} onClick={() => setQuery((current) => ({ ...current, page: toApiPage(shownPage + 1) }))}>
            다음
          </Button>
        </div>
      </section>

      {formMode ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeEditModal}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="collection-modal-title" onSubmit={handleSaveCollection} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="collection-modal-title">{formMode === 'edit' ? '컬렉션 편집' : '컬렉션 등록'}</h2>
                <p>{editingCollection ? `C-${editingCollection.collectionId} 기본 정보를 저장합니다.` : '신규 컬렉션 기본 정보를 입력합니다.'}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeEditModal}>
                ×
              </button>
            </div>

            {modalError ? <p className={styles.modalError}>{modalError}</p> : null}

            <div className={styles.fieldGrid}>
              <label className={styles.wide}>
                컬렉션명
                <input name="collectionName" type="text" placeholder="이번 주 ABC 추천 도서" defaultValue={formDefaults.name} key={`name-${editingCollection?.collectionId ?? 'new'}`} />
              </label>
              <label>
                구분
                <select name="collectionType" defaultValue={formDefaults.collectionType} key={`type-${editingCollection?.collectionId ?? 'new'}`}>
                  {typeOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                할인율
                <input
                  name="discountRate"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="20"
                  defaultValue={formDefaults.discountRate ?? 0}
                  key={`discountRate-${editingCollection?.collectionId ?? 'new'}`}
                />
              </label>
              <label>
                표시 순서
                <input name="displayOrder" type="number" min="1" placeholder="1" />
              </label>
              <label>
                시작일
                <input name="startDate" type="date" defaultValue={formDefaults.startDate ?? ''} key={`startDate-${editingCollection?.collectionId ?? 'new'}`} />
              </label>
              <label>
                종료일
                <input name="endDate" type="date" defaultValue={formDefaults.endDate ?? ''} key={`endDate-${editingCollection?.collectionId ?? 'new'}`} />
              </label>
              <label>
                상태
                <select name="status" defaultValue={formDefaults.status} key={`status-${editingCollection?.collectionId ?? 'new'}`}>
                  {statusOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.wide}>
                설명
                <textarea
                  name="description"
                  placeholder="컬렉션 설명을 입력해 주세요."
                  defaultValue={formDefaults.description ?? ''}
                  key={`description-${editingCollection?.collectionId ?? 'new'}`}
                />
              </label>
            </div>

            <div className={styles.modalActions}>
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

      {bookManageCollection ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeBookModal}>
          <div className={`${styles.modal} ${styles.bookModal}`} role="dialog" aria-modal="true" aria-labelledby="collection-books-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="collection-books-modal-title">컬렉션 도서 관리</h2>
                <p>{bookManageCollection.name}에 포함될 도서를 정렬하고 제외합니다.</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeBookModal}>
                ×
              </button>
            </div>

            {bookModalError ? <p className={styles.modalError}>{bookModalError}</p> : null}

            <div className={styles.addBookRow}>
              <input value={newBookTitle} onChange={(event) => setNewBookTitle(event.target.value)} placeholder="추가할 도서명" />
              <Button type="button" onClick={addManagedBook}>
                도서 추가
              </Button>
            </div>

            <div className={styles.bookList}>
              {managedBooks.length > 0 ? (
                managedBooks.map((book) => (
                  <div className={styles.bookRow} key={book.bookId}>
                    <input
                      aria-label={`${book.title} 표시 순서`}
                      type="number"
                      min="1"
                      value={book.displayOrder ?? ''}
                      onChange={(event) => updateManagedBookOrder(book.bookId, Number(event.target.value))}
                    />
                    <div>
                      <strong>{book.title}</strong>
                      <span>도서 상태: {book.status}</span>
                    </div>
                    <Button type="button" variant="danger" onClick={() => removeManagedBook(book.bookId)}>
                      제외
                    </Button>
                  </div>
                ))
              ) : (
                <p className={styles.emptyBooks}>등록된 도서가 없습니다.</p>
              )}
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={closeBookModal} disabled={isSavingBooks}>
                취소
              </Button>
              <Button type="button" onClick={handleSaveBooks} disabled={isSavingBooks}>
                {isSavingBooks ? '저장 중' : '도서 구성 저장'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
