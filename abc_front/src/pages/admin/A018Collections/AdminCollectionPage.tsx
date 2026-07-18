import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  getAdminCollections,
  patchAdminCollection,
  saveAdminCollection,
  saveAdminCollectionBooks,
} from '../../../api/adminCollectionApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminCollectionBookItem,
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

const fallbackCollections: AdminCollectionItem[] = [
  {
    collectionId: 1001,
    collectionName: '이번 주 ABC 추천 도서',
    collectionType: 'EVENT',
    discountRate: 20,
    description: '메인에서 노출할 주간 추천 도서 묶음입니다.',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'ACTIVE',
    displayOrder: 1,
    bookCount: 4,
    books: [
      { bookId: 101, title: '책방의 계절', author: '이서윤', publisherName: '미래출판', displayOrder: 1 },
      { bookId: 102, title: '해커스 토익 기출 VOCA', author: '김하늘', publisherName: 'ABC Press', displayOrder: 2 },
      { bookId: 103, title: '유럽 도시 기행', author: '이서윤', publisherName: '여행책방', displayOrder: 3 },
      { bookId: 104, title: '나의 첫 번째 부동산 교과서', author: '김하늘', publisherName: 'ABC Press', displayOrder: 4 },
    ],
  },
  {
    collectionId: 1002,
    collectionName: '전자책 입문 시리즈',
    collectionType: 'SERIES',
    discountRate: 0,
    description: '처음 전자책을 읽는 사용자를 위한 기본 시리즈입니다.',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
    displayOrder: 2,
    bookCount: 3,
    books: [
      { bookId: 201, title: '처음 만나는 전자책', author: '박도윤', publisherName: '디지털북스', displayOrder: 1 },
      { bookId: 202, title: '독서 습관 만들기', author: '최민지', publisherName: 'ABC Press', displayOrder: 2 },
      { bookId: 203, title: '모바일 독서법', author: '한지우', publisherName: '미래출판', displayOrder: 3 },
    ],
  },
  {
    collectionId: 1003,
    collectionName: '여름방학 무료책 모음',
    collectionType: 'EVENT',
    discountRate: 100,
    description: '방학 기간에 무료로 노출할 이벤트 컬렉션입니다.',
    startDate: '2026-07-10',
    endDate: '2026-08-20',
    status: 'HIDDEN',
    displayOrder: 3,
    bookCount: 2,
    books: [
      { bookId: 301, title: '방학에 읽는 과학', author: '정유나', publisherName: '청림', displayOrder: 1 },
      { bookId: 302, title: '청소년을 위한 경제', author: '서도현', publisherName: 'ABC Press', displayOrder: 2 },
    ],
  },
  {
    collectionId: 1004,
    collectionName: '상반기 베스트 시리즈',
    collectionType: 'SERIES',
    discountRate: 10,
    description: '상반기 베스트셀러를 묶은 시리즈입니다.',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    status: 'ENDED',
    displayOrder: 4,
    bookCount: 5,
    books: [
      { bookId: 401, title: '일 잘하는 사람의 문장', author: '김하늘', publisherName: 'ABC Press', displayOrder: 1 },
      { bookId: 402, title: '품격 있는 대화를 위하여', author: '이서윤', publisherName: '문장사', displayOrder: 2 },
    ],
  },
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

function buildFallbackPage(query: AdminCollectionListQuery): PageResponse<AdminCollectionItem> {
  const keyword = query.q?.trim().toLowerCase();
  const filtered = fallbackCollections.filter((collection) => {
    const matchesKeyword = keyword
      ? [collection.collectionName, collection.description].join(' ').toLowerCase().includes(keyword)
      : true;
    const matchesType = query.collectionType ? collection.collectionType === query.collectionType : true;
    const matchesStatus = query.status ? collection.status === query.status : true;

    return matchesKeyword && matchesType && matchesStatus;
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

function updateCollection(
  collections: AdminCollectionItem[],
  collectionId: number,
  updater: (collection: AdminCollectionItem) => AdminCollectionItem,
) {
  return collections.map((collection) => (collection.collectionId === collectionId ? updater(collection) : collection));
}

function buildPageFromCollections(collections: AdminCollectionItem[], query: AdminCollectionListQuery): PageResponse<AdminCollectionItem> {
  const page = buildFallbackPage(query);
  const keyword = query.q?.trim().toLowerCase();
  const filtered = collections.filter((collection) => {
    const matchesKeyword = keyword
      ? [collection.collectionName, collection.description].join(' ').toLowerCase().includes(keyword)
      : true;
    const matchesType = query.collectionType ? collection.collectionType === query.collectionType : true;
    const matchesStatus = query.status ? collection.status === query.status : true;

    return matchesKeyword && matchesType && matchesStatus;
  });
  const start = (query.page ?? 0) * (query.size ?? PAGE_SIZE);

  return {
    ...page,
    content: filtered.slice(start, start + (query.size ?? PAGE_SIZE)),
    totalElements: filtered.length,
    totalPages: Math.max(Math.ceil(filtered.length / (query.size ?? PAGE_SIZE)), 1),
  };
}

export function AdminCollectionPage() {
  const [allCollections, setAllCollections] = useState<AdminCollectionItem[]>(fallbackCollections);
  const [collectionsPage, setCollectionsPage] = useState<PageResponse<AdminCollectionItem> | null>(null);
  const [query, setQuery] = useState<AdminCollectionListQuery>({ page: 0, size: PAGE_SIZE });
  const [selectedCollection, setSelectedCollection] = useState<AdminCollectionItem | null>(null);
  const [bookManageCollection, setBookManageCollection] = useState<AdminCollectionItem | null>(null);
  const [managedBooks, setManagedBooks] = useState<AdminCollectionBookItem[]>([]);
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

  const summary = useMemo(
    () => ({
      total: allCollections.length,
      active: allCollections.filter((collection) => collection.status === 'ACTIVE').length,
      hidden: allCollections.filter((collection) => collection.status === 'HIDDEN').length,
      ended: allCollections.filter((collection) => collection.status === 'ENDED').length,
    }),
    [allCollections],
  );

  useEffect(() => {
    let ignore = false;

    async function loadCollections() {
      setIsLoading(true);
      setNoticeMessage('');

      try {
        const data = await getAdminCollections(query);
        if (!ignore) {
          setCollectionsPage(data);
          setAllCollections((current) => (data.content.length ? data.content : current));
        }
      } catch (error) {
        if (!ignore) {
          setCollectionsPage(buildPageFromCollections(allCollections, query));
          setNoticeMessage(`${getApiErrorMessage(error)} 서버 연결 전까지 임시 컬렉션이 표시됩니다.`);
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
  }, [allCollections, query]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setQuery({
      q: String(formData.get('q') ?? '').trim() || undefined,
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
    const nextId = Math.max(...allCollections.map((collection) => collection.collectionId), 1000) + 1;
    setSelectedCollection({
      collectionId: nextId,
      collectionName: '',
      collectionType: 'EVENT',
      discountRate: 0,
      description: '',
      startDate: '',
      endDate: '',
      status: 'ACTIVE',
      displayOrder: allCollections.length + 1,
      bookCount: 0,
      books: [],
    });
    setModalError('');
  }

  function openEditModal(collection: AdminCollectionItem) {
    setSelectedCollection(collection);
    setModalError('');
  }

  function closeEditModal() {
    if (isSaving) return;
    setSelectedCollection(null);
    setModalError('');
  }

  function openBookModal(collection: AdminCollectionItem) {
    setBookManageCollection(collection);
    setManagedBooks([...(collection.books ?? [])].sort((a, b) => a.displayOrder - b.displayOrder));
    setNewBookTitle('');
    setBookModalError('');
  }

  function closeBookModal() {
    if (isSavingBooks) return;
    setBookManageCollection(null);
    setManagedBooks([]);
    setBookModalError('');
  }

  async function handleSaveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCollection) return;

    const formData = new FormData(event.currentTarget);
    const collectionName = String(formData.get('collectionName') ?? '').trim();
    const collectionType = String(formData.get('collectionType') ?? 'EVENT') as AdminCollectionType;
    const status = String(formData.get('status') ?? 'ACTIVE') as AdminCollectionStatus;
    const discountRate = Number(formData.get('discountRate') ?? 0);
    const displayOrder = Number(formData.get('displayOrder') ?? 1);
    const startDate = String(formData.get('startDate') ?? '').trim();
    const endDate = String(formData.get('endDate') ?? '').trim();

    if (!collectionName) {
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

    if (displayOrder <= 0) {
      setModalError('표시 순서는 1 이상이어야 합니다.');
      return;
    }

    const payload: AdminCollectionSaveRequest = {
      collectionName,
      collectionType,
      discountRate,
      description: String(formData.get('description') ?? '').trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status,
      displayOrder,
    };

    setIsSaving(true);
    setModalError('');

    try {
      await saveAdminCollection(selectedCollection.collectionId, payload);
      setSuccessMessage('컬렉션이 저장되었습니다.');
    } catch (error) {
      setNoticeMessage(getApiErrorMessage(error));
      setSuccessMessage('서버 연결 전이라 화면에서만 컬렉션이 반영되었습니다.');
    } finally {
      const nextCollection: AdminCollectionItem = {
        ...selectedCollection,
        ...payload,
      };
      setAllCollections((current) => {
        const exists = current.some((collection) => collection.collectionId === selectedCollection.collectionId);
        return exists
          ? updateCollection(current, selectedCollection.collectionId, () => nextCollection)
          : [nextCollection, ...current];
      });
      setSelectedCollection(null);
      setIsSaving(false);
    }
  }

  async function handlePatchStatus(collection: AdminCollectionItem, status: AdminCollectionStatus) {
    try {
      await patchAdminCollection(collection.collectionId, {
        status,
        reason: '관리자 컬렉션 상태 변경',
      });
      setSuccessMessage('컬렉션 상태가 변경되었습니다.');
    } catch (error) {
      setNoticeMessage(getApiErrorMessage(error));
      setSuccessMessage('서버 연결 전이라 화면에서만 상태가 반영되었습니다.');
    } finally {
      setAllCollections((current) => updateCollection(current, collection.collectionId, (item) => ({ ...item, status })));
    }
  }

  function addManagedBook() {
    const title = newBookTitle.trim();

    if (!title) {
      setBookModalError('추가할 도서명을 입력해 주세요.');
      return;
    }

    const nextId = Math.max(...managedBooks.map((book) => book.bookId), 500) + 1;
    setManagedBooks((current) => [
      ...current,
      {
        bookId: nextId,
        title,
        author: '관리자 입력',
        publisherName: 'ABC Press',
        displayOrder: current.length + 1,
      },
    ]);
    setNewBookTitle('');
    setBookModalError('');
  }

  function removeManagedBook(bookId: number) {
    setManagedBooks((current) =>
      current
        .filter((book) => book.bookId !== bookId)
        .map((book, index) => ({
          ...book,
          displayOrder: index + 1,
        })),
    );
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

    const sortedBooks = [...managedBooks].sort((a, b) => a.displayOrder - b.displayOrder);
    const hasDuplicateOrder = new Set(sortedBooks.map((book) => book.displayOrder)).size !== sortedBooks.length;

    if (hasDuplicateOrder) {
      setBookModalError('표시 순서가 중복되지 않게 입력해 주세요.');
      return;
    }

    setIsSavingBooks(true);
    setBookModalError('');

    try {
      await saveAdminCollectionBooks(bookManageCollection.collectionId, {
        books: sortedBooks.map((book) => ({
          bookId: book.bookId,
          displayOrder: book.displayOrder,
        })),
      });
      setSuccessMessage('컬렉션 도서 구성이 저장되었습니다.');
    } catch (error) {
      setNoticeMessage(getApiErrorMessage(error));
      setSuccessMessage('서버 연결 전이라 화면에서만 도서 구성이 반영되었습니다.');
    } finally {
      setAllCollections((current) =>
        updateCollection(current, bookManageCollection.collectionId, (collection) => ({
          ...collection,
          books: sortedBooks,
          bookCount: sortedBooks.length,
        })),
      );
      setBookManageCollection(null);
      setManagedBooks([]);
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
          <input name="q" type="search" placeholder="컬렉션명, 설명" defaultValue={query.q ?? ''} />
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
                      <strong>{collection.collectionName}</strong>
                      <small>{collection.description || '-'}</small>
                    </td>
                    <td>{getTypeLabel(collection.collectionType)}</td>
                    <td>{formatPeriod(collection)}</td>
                    <td>{collection.discountRate ? `${collection.discountRate}%` : '-'}</td>
                    <td>{collection.bookCount.toLocaleString('ko-KR')}</td>
                    <td>{collection.displayOrder}</td>
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

      {selectedCollection ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeEditModal}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="collection-modal-title" onSubmit={handleSaveCollection} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="collection-modal-title">컬렉션 편집</h2>
                <p>C-{selectedCollection.collectionId} 기본 정보를 저장합니다.</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeEditModal}>
                ×
              </button>
            </div>

            {modalError ? <p className={styles.modalError}>{modalError}</p> : null}

            <div className={styles.fieldGrid}>
              <label className={styles.wide}>
                컬렉션명
                <input name="collectionName" type="text" placeholder="이번 주 ABC 추천 도서" defaultValue={selectedCollection.collectionName} />
              </label>
              <label>
                구분
                <select name="collectionType" defaultValue={selectedCollection.collectionType}>
                  {typeOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                할인율
                <input name="discountRate" type="number" min="0" max="100" placeholder="20" defaultValue={selectedCollection.discountRate ?? 0} />
              </label>
              <label>
                표시 순서
                <input name="displayOrder" type="number" min="1" placeholder="1" defaultValue={selectedCollection.displayOrder} />
              </label>
              <label>
                시작일
                <input name="startDate" type="date" defaultValue={selectedCollection.startDate ?? ''} />
              </label>
              <label>
                종료일
                <input name="endDate" type="date" defaultValue={selectedCollection.endDate ?? ''} />
              </label>
              <label>
                상태
                <select name="status" defaultValue={selectedCollection.status}>
                  {statusOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.wide}>
                설명
                <textarea name="description" placeholder="컬렉션 설명을 입력해 주세요." defaultValue={selectedCollection.description ?? ''} />
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
                <p>{bookManageCollection.collectionName}에 포함될 도서를 정렬하고 제외합니다.</p>
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
                      value={book.displayOrder}
                      onChange={(event) => updateManagedBookOrder(book.bookId, Number(event.target.value))}
                    />
                    <div>
                      <strong>{book.title}</strong>
                      <span>
                        {book.author || book.authors?.join(', ') || '-'} · {book.publisherName || '-'}
                      </span>
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
