import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createAdminBook } from '../../../api/adminBookApi';
import { getCategories } from '../../../api/bookApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminBookCreateRequest,
  AdminBookPageRequest,
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

function flattenCategories(categories: Category[]): Category[] {
  return categories.flatMap((category) => [category, ...(category.children ? flattenCategories(category.children) : [])]);
}

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminBookCreatePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [pages, setPages] = useState<AdminBookPageRequest[]>([{ pageNo: 1, pageContent: '' }]);
  const [rentalType, setRentalType] = useState<AdminBookRentalType>('PAID');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function addPage() {
    setPages((current) => [...current, { pageNo: current.length + 1, pageContent: '' }]);
  }

  function updatePage(index: number, field: keyof AdminBookPageRequest, value: string) {
    setPages((current) =>
      current.map((page, pageIndex) =>
        pageIndex === index
          ? {
              ...page,
              [field]: field === 'pageNo' ? Number(value) || 1 : value,
            }
          : page,
      ),
    );
  }

  function removePage(index: number) {
    setPages((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, pageIndex) => pageIndex !== index);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const publisherName = String(formData.get('publisherName') ?? '').trim();
    const authors = splitList(formData.get('authors'));
    const categoryIds = formData
      .getAll('categoryIds')
      .map((value) => Number(value))
      .filter(Boolean);
    const validPages = pages
      .map((page) => ({
        pageNo: Number(page.pageNo) || 1,
        pageContent: page.pageContent.trim(),
      }))
      .filter((page) => page.pageContent);

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

    if (validPages.length === 0) {
      setErrorMessage('전자책 본문 페이지를 1개 이상 입력해 주세요.');
      return;
    }

    const rentalPrice = rentalType === 'FREE' ? 0 : Number(formData.get('rentalPrice') ?? 0);

    if (rentalType === 'PAID' && rentalPrice <= 0) {
      setErrorMessage('유료 도서는 대여 가격을 1원 이상 입력해야 합니다.');
      return;
    }

    const payload: AdminBookCreateRequest = {
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
      pages: validPages,
    };

    setIsSubmitting(true);

    try {
      const response = await createAdminBook(payload);
      setSuccessMessage('도서가 등록되었습니다.');
      navigate(`/admin/books/${response.bookId}/edit`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={`page-section ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Book</span>
          <h1>도서 등록</h1>
          <p>도서 기본 정보, 상세 입력, 전자책 페이지 정보를 등록합니다.</p>
        </div>

        <div className={styles.headerActions}>
          <Button type="submit" form="admin-book-create-form" disabled={isSubmitting}>
            {isSubmitting ? '등록 중' : '등록'}
          </Button>
          <Link className="button button-secondary" to="/admin/books">
            취소 → A-004
          </Link>
        </div>
      </div>

      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
      {successMessage ? <p className={styles.success}>{successMessage}</p> : null}

      <form id="admin-book-create-form" className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>기본 정보</h2>
              <p>제목, ISBN, 출판사, 저자를 입력합니다.</p>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.wide}>
                제목
                <input name="title" type="text" placeholder="도서 제목" />
              </label>
              <label>
                ISBN
                <input name="isbn" type="text" placeholder="ISBN" />
              </label>
              <label>
                출판사명
                <input name="publisherName" type="text" placeholder="출판사명" />
              </label>
              <label className={styles.wide}>
                저자
                <input name="authors" type="text" placeholder="저자명 / 표시 순서" />
              </label>
              <label className={styles.wide}>
                키워드
                <input name="keywords" type="text" placeholder="키워드" />
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>분류/대여/표시</h2>
              <p>카테고리, 대여 유형, 가격, 표시 상태를 설정합니다.</p>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.wide}>
                문학 카테고리
                <select name="categoryIds" multiple size={5}>
                  {categories.map((category) => (
                    <option value={category.categoryId} key={category.categoryId}>
                      {category.name || category.categoryName}
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
                <input name="defaultRentalDays" type="number" min="1" defaultValue="14" />
              </label>
              <label>
                대여 가격
                <input name="rentalPrice" type="number" min="0" defaultValue={rentalType === 'FREE' ? '0' : '3500'} disabled={rentalType === 'FREE'} />
              </label>
              <label>
                상태
                <select name="status" defaultValue="AVAILABLE">
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
              <p>책 소개, 목차, 출판사 리뷰를 입력합니다.</p>
            </div>

            <label>
              책 소개
              <textarea name="description" placeholder="이 책의 핵심 내용과 특징을 간단히 입력합니다." />
            </label>
            <div className={styles.fieldGrid}>
              <label>
                목차
                <textarea name="tableOfContents" placeholder="1장 데이터 모델&#10;2장 SQL 기초" />
              </label>
              <label>
                출판사 리뷰/상세 내용
                <textarea name="publisherReview" placeholder="학습자를 위한 구성과 실무 예제를 작성합니다." />
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>전자책 파일/페이지</h2>
              <p>파일 업로드 대신 URL과 페이지 본문을 입력합니다.</p>
            </div>

            <label>
              커버 URL
              <input name="coverImageUrl" type="url" placeholder="https://cdn.example.com/book-1001.epub" />
            </label>

            <div className={styles.pageList}>
              {pages.map((page, index) => (
                <div className={styles.pageRow} key={index}>
                  <label>
                    페이지 번호
                    <input value={page.pageNo} type="number" min="1" onChange={(event) => updatePage(index, 'pageNo', event.target.value)} />
                  </label>
                  <label>
                    페이지 본문
                    <textarea value={page.pageContent} onChange={(event) => updatePage(index, 'pageContent', event.target.value)} placeholder="본문 텍스트를 입력합니다." />
                  </label>
                  <Button type="button" variant="secondary" onClick={() => removePage(index)} disabled={pages.length === 1}>
                    페이지 삭제
                  </Button>
                </div>
              ))}
            </div>

            <Button type="button" variant="secondary" onClick={addPage}>
              페이지 추가
            </Button>
          </section>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>검증 및 운영 기준</h2>
            <p>등록 전에 확인해야 하는 규칙입니다.</p>
          </div>

          <div className={styles.ruleGrid}>
            <span>ISBN 중복 없음</span>
            <span>유료 도서 가격 0원 초과</span>
            <span>무료 도서 가격 0원</span>
            <span>전자책 본문 최소 1페이지</span>
            <span>카테고리 1개 이상 선택</span>
            <span>감사 로그는 서버에서 기록</span>
          </div>
        </section>
      </form>
    </section>
  );
}
