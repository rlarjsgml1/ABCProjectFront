// 공지사항 목록(U029) 화면 — 공지사항을 페이지네이션으로 조회하고 상세 화면으로 이동시킨다
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getNotices } from '../../../api/noticeApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Pagination } from '../../../components/common/Pagination';
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
  const [noticePage, setNoticePage] = useState<NoticePage>({
    content: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });
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
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getApiErrorMessage(error));
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

  const movePage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  };

  return (
    <section className={`page-section ${styles.page}`}>
      <div className={styles.headerRow}>
        <h1>공지사항</h1>
      </div>

      <div className={styles.divider} />

      {errorMessage ? <div className="status-banner">{errorMessage}</div> : null}

      <div className={styles.list}>
        {isLoading ? (
          <p className={styles.status}>공지사항을 불러오는 중입니다.</p>
        ) : noticePage.content.length > 0 ? (
          noticePage.content.map((notice) => (
            <Link className={styles.row} to={`/notices/${notice.noticeId}`} key={notice.noticeId}>
              <span className={styles.badge}>공지</span>
              <strong className={styles.rowTitle}>{notice.title}</strong>
              <span className={styles.rowDate}>{formatDate(notice.createdAt)}</span>
            </Link>
          ))
        ) : (
          <p className={styles.status}>등록된 공지사항이 없습니다.</p>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={movePage} />
    </section>
  );
}
