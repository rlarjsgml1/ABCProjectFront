import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFallbackNoticePage, getNotices } from '../../../api/noticeApi';
import { EmptyState } from '../../../components/common/EmptyState';
import type { NoticePage } from '../../../types/api';
import styles from '../../../styles/NoticeListPage.module.css';

const PAGE_SIZE = 13;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export function NoticeListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [noticePage, setNoticePage] = useState<NoticePage>(() => getFallbackNoticePage(0, PAGE_SIZE));
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const currentPage = Number(searchParams.get('page') ?? '0');

  useEffect(() => {
    let ignore = false;

    async function loadNotices() {
      setIsLoading(true);
      try {
        const data = await getNotices(currentPage, PAGE_SIZE);
        if (!ignore) {
          setNoticePage(data);
          setErrorMessage('');
        }
      } catch {
        if (!ignore) {
          setNoticePage(getFallbackNoticePage(currentPage, PAGE_SIZE));
          setErrorMessage('서버 데이터 연결 전까지 임시 공지사항이 표시됩니다.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadNotices();

    return () => {
      ignore = true;
    };
  }, [currentPage]);

  const totalPages = Math.max(1, noticePage.totalPages);
  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index);

  const movePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 0), totalPages - 1);
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  return (
    <section className={`page-section ${styles.page}`}>
      <div className={styles.headerRow}>
        <h1>공지사항</h1>
      </div>

      <div className={styles.divider} />

      {errorMessage ? <div className="status-banner">{errorMessage}</div> : null}
      {isLoading ? <div className="status-banner">공지사항을 불러오는 중입니다.</div> : null}

      {!isLoading && !noticePage.content.length ? (
        <EmptyState title="등록된 공지사항이 없습니다." description="잠시 후 다시 확인해주세요." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">제목</th>
                <th scope="col">등록일</th>
              </tr>
            </thead>
            <tbody>
              {noticePage.content.map((notice) => (
                <tr key={notice.noticeId}>
                  <td>
                    <Link to={`/notices/${notice.noticeId}`}>{notice.title}</Link>
                  </td>
                  <td className={styles.dateCell}>{formatDate(notice.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.pagination} aria-label="페이지 이동">
        <button type="button" onClick={() => movePage(currentPage - 1)} disabled={currentPage <= 0}>
          {'<'}
        </button>
        {pageNumbers.map((page) => (
          <button
            className={currentPage === page ? styles.pageActive : ''}
            type="button"
            onClick={() => movePage(page)}
            key={page}
          >
            {page + 1}
          </button>
        ))}
        <button type="button" onClick={() => movePage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>
          {'>'}
        </button>
      </div>
    </section>
  );
}
