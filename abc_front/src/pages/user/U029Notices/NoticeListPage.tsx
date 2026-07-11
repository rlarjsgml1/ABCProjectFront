import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFallbackNoticePage, getNotices } from '../../../api/noticeApi';
import { Pagination } from '../../../components/common/Pagination';
import { Table } from '../../../components/common/Table';
import type { NoticeItem, NoticePage } from '../../../types/api';
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

      <Table<NoticeItem>
        columns={[
          { key: 'title', header: '제목', render: (notice) => <Link to={`/notices/${notice.noticeId}`}>{notice.title}</Link> },
          { key: 'createdAt', header: '등록일', align: 'right', render: (notice) => formatDate(notice.createdAt) },
        ]}
        rows={noticePage.content}
        rowKey={(notice) => notice.noticeId}
        isLoading={isLoading}
        loadingMessage="공지사항을 불러오는 중입니다."
        emptyMessage="등록된 공지사항이 없습니다."
      />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={movePage} />
    </section>
  );
}
