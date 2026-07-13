// 공통 페이지네이션 컴포넌트 — 페이지 번호 목록과 이전/다음 이동 버튼을 제공
import styles from './Pagination.module.css';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
  className?: string;
  ariaLabel?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  className = '',
  ariaLabel = '페이지 이동',
}: PaginationProps) {
  const pageNumbers = Array.from({ length: Math.min(totalPages, maxVisible) }, (_, index) => index);

  const movePage = (page: number) => {
    onPageChange(Math.min(Math.max(page, 0), totalPages - 1));
  };

  return (
    <div className={`${styles.pagination} ${className}`.trim()} aria-label={ariaLabel}>
      <button
        type="button"
        className={styles.navButton}
        onClick={() => movePage(currentPage - 1)}
        disabled={currentPage <= 0}
      >
        {'<'}
      </button>
      {pageNumbers.map((page) => (
        <button
          key={page}
          type="button"
          className={`${styles.pageButton} ${page === currentPage ? styles.isActive : ''}`}
          onClick={() => movePage(page)}
        >
          {page + 1}
        </button>
      ))}
      <button
        type="button"
        className={styles.navButton}
        onClick={() => movePage(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
      >
        {'>'}
      </button>
    </div>
  );
}
