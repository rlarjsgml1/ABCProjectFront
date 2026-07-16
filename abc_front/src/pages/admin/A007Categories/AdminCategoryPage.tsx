import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getAdminCategories, saveAdminCategory } from '../../../api/adminCategoryApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { AdminCategoryItem, AdminCategorySaveRequest, AdminCategoryStatus } from '../../../types/api';
import styles from '../../../styles/AdminCategoryPage.module.css';

type CategoryRow = {
  parent: AdminCategoryItem;
  child: AdminCategoryItem | null;
};

const statusOptions: Array<{ value: AdminCategoryStatus; label: string }> = [
  { value: 'ACTIVE', label: '노출' },
  { value: 'HIDDEN', label: '숨김' },
  { value: 'INACTIVE', label: '비활성' },
];

const fallbackCategories: AdminCategoryItem[] = [
  {
    categoryId: 1,
    name: '소설',
    displayOrder: 1,
    status: 'ACTIVE',
    bookCount: 18,
    children: [
      { categoryId: 11, parentCategoryId: 1, name: '한국소설', displayOrder: 1, status: 'ACTIVE', bookCount: 7 },
      { categoryId: 12, parentCategoryId: 1, name: '해외소설', displayOrder: 2, status: 'ACTIVE', bookCount: 6 },
      { categoryId: 13, parentCategoryId: 1, name: '장르소설', displayOrder: 3, status: 'HIDDEN', bookCount: 5 },
    ],
  },
  {
    categoryId: 2,
    name: '경제 / 경영',
    displayOrder: 2,
    status: 'ACTIVE',
    bookCount: 15,
    children: [
      { categoryId: 21, parentCategoryId: 2, name: '경영전략', displayOrder: 1, status: 'ACTIVE', bookCount: 6 },
      { categoryId: 22, parentCategoryId: 2, name: '재테크', displayOrder: 2, status: 'ACTIVE', bookCount: 9 },
    ],
  },
  {
    categoryId: 3,
    name: '인문 / 사회 / 역사',
    displayOrder: 3,
    status: 'ACTIVE',
    bookCount: 12,
    children: [
      { categoryId: 31, parentCategoryId: 3, name: '인문학', displayOrder: 1, status: 'ACTIVE', bookCount: 5 },
      { categoryId: 32, parentCategoryId: 3, name: '역사', displayOrder: 2, status: 'ACTIVE', bookCount: 7 },
    ],
  },
  {
    categoryId: 4,
    name: '컴퓨터 / IT',
    displayOrder: 4,
    status: 'ACTIVE',
    bookCount: 20,
    children: [
      { categoryId: 41, parentCategoryId: 4, name: '프로그래밍', displayOrder: 1, status: 'ACTIVE', bookCount: 12 },
      { categoryId: 42, parentCategoryId: 4, name: '데이터베이스', displayOrder: 2, status: 'ACTIVE', bookCount: 8 },
    ],
  },
  {
    categoryId: 5,
    name: '자기계발',
    displayOrder: 5,
    status: 'HIDDEN',
    bookCount: 2,
    children: [{ categoryId: 51, parentCategoryId: 5, name: '습관 / 시간관리', displayOrder: 1, status: 'INACTIVE', bookCount: 2 }],
  },
];

function getCategoryName(category: AdminCategoryItem | null) {
  if (!category) return '-';
  return category.name || category.categoryName || '-';
}

function getCategoryStatus(category: AdminCategoryItem) {
  return category.status ?? 'ACTIVE';
}

function getStatusLabel(status: AdminCategoryStatus | undefined) {
  return statusOptions.find((option) => option.value === status)?.label ?? '-';
}

function countCategories(categories: AdminCategoryItem[]) {
  return categories.reduce((count, category) => count + 1 + (category.children?.length ?? 0), 0);
}

function countVisibleCategories(categories: AdminCategoryItem[]) {
  return categories.reduce((count, category) => {
    const parentCount = getCategoryStatus(category) === 'ACTIVE' ? 1 : 0;
    const childCount = category.children?.filter((child) => getCategoryStatus(child) === 'ACTIVE').length ?? 0;
    return count + parentCount + childCount;
  }, 0);
}

function countHiddenCategories(categories: AdminCategoryItem[]) {
  return categories.reduce((count, category) => {
    const parentCount = getCategoryStatus(category) !== 'ACTIVE' ? 1 : 0;
    const childCount = category.children?.filter((child) => getCategoryStatus(child) !== 'ACTIVE').length ?? 0;
    return count + parentCount + childCount;
  }, 0);
}

function countOrderIssues(categories: AdminCategoryItem[]) {
  return categories.reduce((count, category) => {
    const childOrders = category.children?.map((child) => child.displayOrder ?? 0) ?? [];
    const hasDuplicateOrder = new Set(childOrders).size !== childOrders.length;
    return count + (hasDuplicateOrder ? 1 : 0);
  }, 0);
}

function toCategoryRows(categories: AdminCategoryItem[]): CategoryRow[] {
  return categories.flatMap<CategoryRow>((parent) => {
    if (!parent.children?.length) {
      return [{ parent, child: null }];
    }

    return parent.children.map((child) => ({ parent, child }));
  });
}

function updateCategoryInTree(
  categories: AdminCategoryItem[],
  categoryId: number,
  payload: AdminCategorySaveRequest,
): AdminCategoryItem[] {
  return categories.map((category) => {
    if (category.categoryId === categoryId) {
      return {
        ...category,
        ...payload,
      };
    }

    return {
      ...category,
      children: category.children?.map((child) =>
        child.categoryId === categoryId
          ? {
              ...child,
              ...payload,
            }
          : child,
      ),
    };
  });
}

export function AdminCategoryPage() {
  const [categories, setCategories] = useState<AdminCategoryItem[]>(fallbackCategories);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modalError, setModalError] = useState('');

  const rows = useMemo(() => toCategoryRows(categories), [categories]);
  const totalCategoryCount = countCategories(categories);
  const visibleCategoryCount = countVisibleCategories(categories);
  const hiddenCategoryCount = countHiddenCategories(categories);
  const orderIssueCount = countOrderIssues(categories);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      setIsLoading(true);
      setNoticeMessage('');

      try {
        const data = await getAdminCategories();
        if (!ignore) {
          setCategories(data.length ? data : fallbackCategories);
        }
      } catch (error) {
        if (!ignore) {
          setCategories(fallbackCategories);
          setNoticeMessage(`${getApiErrorMessage(error)} 서버 연결 전까지 임시 카테고리가 표시됩니다.`);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  function openEditModal(category: AdminCategoryItem) {
    setSelectedCategory(category);
    setModalError('');
  }

  function closeEditModal() {
    if (isSaving) return;
    setSelectedCategory(null);
    setModalError('');
  }

  async function handleSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCategory) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const displayOrder = Number(formData.get('displayOrder') ?? 0);
    const status = String(formData.get('status') ?? 'ACTIVE') as AdminCategoryStatus;

    if (!name) {
      setModalError('카테고리명을 입력해 주세요.');
      return;
    }

    if (displayOrder <= 0) {
      setModalError('표시 순서는 1 이상이어야 합니다.');
      return;
    }

    const payload: AdminCategorySaveRequest = {
      parentCategoryId: selectedCategory.parentCategoryId ?? null,
      name,
      displayOrder,
      status,
    };

    setIsSaving(true);
    setModalError('');

    try {
      await saveAdminCategory(selectedCategory.categoryId, payload);
      setCategories((current) => updateCategoryInTree(current, selectedCategory.categoryId, payload));
      setSuccessMessage('카테고리가 저장되었습니다.');
      setSelectedCategory(null);
    } catch (error) {
      setCategories((current) => updateCategoryInTree(current, selectedCategory.categoryId, payload));
      setSuccessMessage('서버 연결 전이라 화면에서만 카테고리가 반영되었습니다.');
      setNoticeMessage(getApiErrorMessage(error));
      setSelectedCategory(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={`page-section ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Category</span>
          <h1>카테고리 관리</h1>
        </div>
      </div>

      <section className={styles.summaryPanel}>
        <h2>카테고리 요약</h2>
        <div className={styles.summaryGrid}>
          <article>
            <span>전체카테고리</span>
            <strong>{totalCategoryCount}개</strong>
          </article>
          <article>
            <span>노출카테고리</span>
            <strong>{visibleCategoryCount}개</strong>
          </article>
          <article>
            <span>숨김카테고리</span>
            <strong>{hiddenCategoryCount}개</strong>
          </article>
          <article>
            <span>검토/순서 이슈</span>
            <strong>{orderIssueCount}건</strong>
          </article>
        </div>
      </section>

      {noticeMessage ? <p className={styles.notice}>{noticeMessage}</p> : null}
      {successMessage ? <p className={styles.success}>{successMessage}</p> : null}

      <section className={styles.tablePanel}>
        <h2>카테고리 계층 테이블</h2>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>상위카테고리</th>
                <th>하위 카테고리</th>
                <th>도서 수</th>
                <th>표시 순서</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6}>카테고리 정보를 불러오는 중입니다.</td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map(({ parent, child }) => {
                  const targetCategory = child ?? parent;
                  const status = getCategoryStatus(targetCategory);

                  return (
                    <tr key={`${parent.categoryId}-${child?.categoryId ?? 'parent'}`}>
                      <td>{getCategoryName(parent)}</td>
                      <td>{getCategoryName(child)}</td>
                      <td>{(targetCategory.bookCount ?? 0).toLocaleString('ko-KR')}</td>
                      <td>{targetCategory.displayOrder ?? '-'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${status}`]}`}>{getStatusLabel(status)}</span>
                      </td>
                      <td>
                        <Button type="button" variant="secondary" onClick={() => openEditModal(targetCategory)}>
                          수정
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>표시할 카테고리가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCategory ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeEditModal}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="category-modal-title" onSubmit={handleSaveCategory} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="category-modal-title">카테고리 수정</h2>
                <p>C-{selectedCategory.categoryId} 표시 정보와 상태를 수정합니다.</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeEditModal}>
                ×
              </button>
            </div>

            {modalError ? <p className={styles.modalError}>{modalError}</p> : null}

            <label>
              카테고리명
              <input name="name" type="text" defaultValue={getCategoryName(selectedCategory)} />
            </label>

            <label>
              표시 순서
              <input name="displayOrder" type="number" min="1" defaultValue={selectedCategory.displayOrder ?? 1} />
            </label>

            <label>
              상태
              <select name="status" defaultValue={getCategoryStatus(selectedCategory)}>
                {statusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

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
    </section>
  );
}
