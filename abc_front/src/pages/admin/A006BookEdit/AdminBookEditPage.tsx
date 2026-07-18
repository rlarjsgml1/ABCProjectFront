import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { changeAdminBookStatus, getAdminBook, updateAdminBook } from '../../../api/adminBookApi';
import { getCategories } from '../../../api/bookApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminBookDetail,
  AdminBookRentalType,
  AdminBookStatus,
  Category,
} from '../../../types/api';
import styles from '../../../styles/AdminBookFormPage.module.css';

const fallbackCategories: Category[] = [
  { categoryId: 1, name: '소설' },
  { categoryId: 2, name: '경제 / 경영' },
  { categoryId: 3, name: '인문 / 사회 / 역사' },
  { categoryId: 4, name: '컴퓨터 / IT' },
  { categoryId: 5, name: '자기계발' },
];

const fallbackBook: AdminBookDetail = {
  bookId: 1001,
  title: '데이터베이스 개론',
  isbn: '979-11-0001',
  publisherName: 'ABC Press',
  authors: ['김하늘'],
  categoryId: 4,
  categoryIds: [4],
  categoryName: '컴퓨터 / IT',
  keywords: ['SQL', 'RDBMS', '실무 데이터'],
  rentalType: 'PAID',
  rentalPrice: 3500,
  defaultRentalDays: 14,
  coverImageUrl: 'https://cdn.example.com/book-1001.epub',
  status: 'AVAILABLE',
  description: '데이터베이스의 기본 개념과 실무 활용을 함께 익힐 수 있는 도서입니다.',
  tableOfContents: '1장 데이터 모델\n2장 SQL 기초',
  publisherReview: '학습자를 위한 구성과 실무 예제를 담았습니다.',
};

function flattenCategories(categories: Category[]): Category[] {
  return categories.flatMap((category) => [category, ...(category.children ? flattenCategories(category.children) : [])]);
}

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBook(book: AdminBookDetail): AdminBookDetail {
  const authors = book.authors?.length ? book.authors : book.author ? [book.author] : fallbackBook.authors;
  const categoryIds =
    book.categoryIds?.length
      ? book.categoryIds
      : book.categories?.length
        ? book.categories.map((category) => category.categoryId)
        : book.categoryId
          ? [book.categoryId]
          : fallbackBook.categoryIds;

  return {
    ...fallbackBook,
    ...book,
    authors,
    categoryIds,
    publisherName: book.publisherName || book.publisher || fallbackBook.publisherName,
    keywords: book.keywords?.length ? book.keywords : fallbackBook.keywords,
    defaultRentalDays: book.defaultRentalDays || fallbackBook.defaultRentalDays,
    description: book.description || fallbackBook.description,
  };
}

export function AdminBookEditPage() {
  const { bookId } = useParams();
  const numericBookId = Number(bookId);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [book, setBook] = useState<AdminBookDetail | null>(null);
  const [rentalType, setRentalType] = useState<AdminBookRentalType>('PAID');
  const [statusValue, setStatusValue] = useState<AdminBookStatus>('AVAILABLE');
  const [statusReason, setStatusReason] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusErrorMessage, setStatusErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const selectedCategoryIds = useMemo(() => new Set(book?.categoryIds ?? []), [book]);

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

    async function loadBook() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminBook(numericBookId);
        if (!ignore) {
          const normalizedBook = normalizeBook(data);
          setBook(normalizedBook);
          setRentalType(normalizedBook.rentalType);
          setStatusValue(normalizedBook.status);
        }
      } catch {
        if (!ignore) {
          const normalizedBook = normalizeBook({ ...fallbackBook, bookId: numericBookId || fallbackBook.bookId });
          setBook(normalizedBook);
          setRentalType(normalizedBook.rentalType);
          setStatusValue(normalizedBook.status);
          setErrorMessage('서버 데이터 연결 전까지 임시 도서 정보가 표시됩니다.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (numericBookId) {
      void loadBook();
    } else {
      setIsLoading(false);
      setErrorMessage('수정할 도서 번호를 확인할 수 없습니다.');
    }

    return () => {
      ignore = true;
    };
  }, [numericBookId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!numericBookId) {
      setErrorMessage('수정할 도서 번호를 확인할 수 없습니다.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const publisherName = String(formData.get('publisherName') ?? '').trim();
    const authors = splitList(formData.get('authors'));
    const categoryIds = formData
      .getAll('categoryIds')
      .map((value) => Number(value))
      .filter(Boolean);

    if (!title) {
      setErrorMessage('도서 제목을 입력해 주세요.');
      return;
    }

    if (!publisherName) {
      setErrorMessage('출판사를 입력해 주세요.');
      return;
    }

    if (authors.length === 0) {
      setErrorMessage('저자를 1명 이상 입력해 주세요.');
      return;
    }

    if (categoryIds.length === 0) {
      setErrorMessage('카테고리를 1개 이상 선택해 주세요.');
      return;
    }

    const rentalPrice = rentalType === 'FREE' ? 0 : Number(formData.get('rentalPrice') ?? 0);

    if (rentalType === 'PAID' && rentalPrice <= 0) {
      setErrorMessage('유료 도서는 대여 가격을 1원 이상 입력해야 합니다.');
      return;
    }

    const payload = {
      title,
      isbn: String(formData.get('isbn') ?? '').trim(),
      publisherName,
      authors,
      categoryIds,
      keywords: splitList(formData.get('keywords')),
      rentalType,
      rentalPrice,
      defaultRentalDays: Number(formData.get('defaultRentalDays') ?? 14) || 14,
      coverImageUrl: String(formData.get('coverImageUrl') ?? '').trim() || undefined,
      status: String(formData.get('status') ?? 'AVAILABLE') as AdminBookStatus,
      description: String(formData.get('description') ?? '').trim(),
      tableOfContents: String(formData.get('tableOfContents') ?? '').trim() || undefined,
      publisherReview: String(formData.get('publisherReview') ?? '').trim() || undefined,
    };

    setIsSubmitting(true);

    try {
      await updateAdminBook(numericBookId, payload);
      const updatedBook = normalizeBook({ ...(book ?? fallbackBook), ...payload, bookId: numericBookId });
      setBook(updatedBook);
      setStatusValue(updatedBook.status);
      setSuccessMessage('도서 정보가 수정되었습니다.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange() {
    setStatusErrorMessage('');

    if (!numericBookId) {
      setStatusErrorMessage('수정할 도서 번호를 확인할 수 없습니다.');
      return;
    }

    if (!statusReason.trim()) {
      setStatusErrorMessage('상태 변경 사유를 입력해 주세요.');
      return;
    }

    setIsChangingStatus(true);

    try {
      const response = await changeAdminBookStatus(numericBookId, {
        status: statusValue,
        reason: statusReason.trim(),
      });
      setBook((current) => (current ? { ...current, status: response.status } : current));
      setSuccessMessage('도서 상태가 변경되었습니다.');
      setStatusReason('');
      setIsStatusModalOpen(false);
    } catch (error) {
      setStatusErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsChangingStatus(false);
    }
  }

  if (isLoading || !book) {
    return (
      <section className={`page-section ${styles.page}`}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Book</span>
            <h1>도서 수정</h1>
            <p>기존 도서 정보를 불러오는 중입니다.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`page-section ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Book</span>
          <h1>도서 수정</h1>
          <p>기존 도서 정보와 전자책 본문을 수정한 뒤 저장합니다.</p>
        </div>

        <div className={styles.headerActions}>
          <Button type="submit" form="admin-book-edit-form" disabled={isSubmitting}>
            {isSubmitting ? '저장 중' : '저장'}
          </Button>
          <Button type="button" variant="danger" onClick={() => setIsStatusModalOpen(true)}>
            상태 변경
          </Button>
          <Link className="button button-secondary" to="/admin/books">
            취소 → A-004
          </Link>
        </div>
      </div>

      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
      {successMessage ? <p className={styles.success}>{successMessage}</p> : null}

      <form id="admin-book-edit-form" key={book.bookId} className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>기본 정보</h2>
              <p>제목, ISBN, 출판사, 저자 표시 순서를 입력합니다.</p>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.wide}>
                제목
                <input name="title" type="text" placeholder="데이터베이스 개론" defaultValue={book.title} />
              </label>
              <label>
                ISBN
                <input name="isbn" type="text" placeholder="979-11-0001" defaultValue={book.isbn ?? ''} />
              </label>
              <label>
                출판사명
                <input name="publisherName" type="text" placeholder="ABC Press" defaultValue={book.publisherName ?? ''} />
              </label>
              <label className={styles.wide}>
                저자
                <input name="authors" type="text" placeholder="김하늘 / 1" defaultValue={(book.authors ?? []).join(', ')} />
              </label>
              <label className={styles.wide}>
                키워드
                <input name="keywords" type="text" placeholder="SQL, RDBMS, 실무 데이터" defaultValue={(book.keywords ?? []).join(', ')} />
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>분류/대여/표시</h2>
              <p>카테고리, 대여 유형, 가격, 상태를 설정합니다.</p>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.wide}>
                문학 카테고리
                <select name="categoryIds" multiple size={5} defaultValue={(book.categoryIds ?? []).map(String)}>
                  {categories.map((category) => (
                    <option value={category.categoryId} key={category.categoryId}>
                      {category.name || category.categoryName}
                      {selectedCategoryIds.has(category.categoryId) ? ' · 선택됨' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                대여 유형
                <select name="rentalType" value={rentalType} onChange={(event) => setRentalType(event.target.value as AdminBookRentalType)}>
                  <option value="PAID">유료</option>
                  <option value="FREE">무료</option>
                </select>
              </label>
              <label>
                기본 대여일
                <input name="defaultRentalDays" type="number" min="1" placeholder="14" defaultValue={book.defaultRentalDays ?? 14} />
              </label>
              <label>
                대여 가격
                <input
                  name="rentalPrice"
                  type="number"
                  min="0"
                  placeholder="3500"
                  defaultValue={rentalType === 'FREE' ? '0' : String(book.rentalPrice ?? 3500)}
                  disabled={rentalType === 'FREE'}
                />
              </label>
              <label>
                상태
                <select name="status" value={statusValue} onChange={(event) => setStatusValue(event.target.value as AdminBookStatus)}>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="HIDDEN">HIDDEN</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            </div>
          </section>
        </div>

        <div className={styles.formGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>상세 입력</h2>
              <p>책 소개, 목차, 출판사 리뷰를 수정합니다.</p>
            </div>

            <label>
              책 소개
              <textarea
                name="description"
                placeholder="데이터베이스의 기본 개념과 실무 활용을 함께 익힐 수 있는 도서입니다."
                defaultValue={book.description ?? ''}
              />
            </label>
            <div className={styles.fieldGrid}>
              <label>
                목차
                <textarea name="tableOfContents" placeholder={'1장 데이터 모델\n2장 SQL 기초'} defaultValue={book.tableOfContents ?? ''} />
              </label>
              <label>
                출판사 리뷰/상세 내용
                <textarea
                  name="publisherReview"
                  placeholder="학습자를 위한 구성과 실무 예제를 담았습니다."
                  defaultValue={book.publisherReview ?? ''}
                />
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>전자책 콘텐츠</h2>
              <p>EPUB 파일은 도서 정보 저장과 별도로 Swagger 또는 Postman에서 수동 업로드합니다.</p>
            </div>

            <label>
              커버 URL
              <input
                name="coverImageUrl"
                type="url"
                placeholder="https://cdn.example.com/book-1001.jpg"
                defaultValue={book.coverImageUrl ?? ''}
              />
            </label>

            <div className={styles.ruleGrid}>
              <span>{'PUT /api/v1/admin/books/{bookId}/epub'}</span>
              <span>multipart field: file</span>
              <span>등록 결과와 EPUB version은 업로드 API 응답에서 확인</span>
            </div>
          </section>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>검증 및 운영 기준</h2>
            <p>수정 전에 확인해야 하는 규칙입니다.</p>
          </div>

          <div className={styles.ruleGrid}>
            <span>ISBN 중복 없음</span>
            <span>유료 도서 가격 0원 초과</span>
            <span>무료 도서 가격 0원</span>
            <span>EPUB 등록 후 열람 가능</span>
            <span>카테고리 1개 이상 선택</span>
            <span>수정 활동 로그 기록</span>
          </div>
        </section>
      </form>

      {isStatusModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setIsStatusModalOpen(false)}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="book-status-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 id="book-status-modal-title">도서 상태 변경</h2>
              <p>숨김, 비활성 처리처럼 노출 상태가 바뀌는 경우 사유를 남깁니다.</p>
            </div>

            <label>
              상태
              <select value={statusValue} onChange={(event) => setStatusValue(event.target.value as AdminBookStatus)}>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="HIDDEN">HIDDEN</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>

            <label>
              변경 사유
              <textarea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="예: 표지 이미지 교체 전까지 임시 숨김 처리" />
            </label>

            {statusErrorMessage ? <p className={styles.modalError}>{statusErrorMessage}</p> : null}

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
                닫기
              </Button>
              <Button type="button" variant="danger" onClick={handleStatusChange} disabled={isChangingStatus}>
                {isChangingStatus ? '변경 중' : '상태 변경'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
