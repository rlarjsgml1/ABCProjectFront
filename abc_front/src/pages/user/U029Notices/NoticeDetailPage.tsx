import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFallbackNoticeDetail, getNoticeDetail } from '../../../api/noticeApi';
import type { NoticeDetail } from '../../../types/api';
import styles from '../../../styles/NoticeDetailPage.module.css';

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

export function NoticeDetailPage() {
  const { noticeId } = useParams();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadNoticeDetail() {
      if (!noticeId) {
        return;
      }

      setIsLoading(true);

      try {
        const data = await getNoticeDetail(Number(noticeId));
        if (!ignore) {
          setNotice(data);
          setErrorMessage('');
        }
      } catch {
        if (!ignore) {
          const fallback = getFallbackNoticeDetail(Number(noticeId));
          setNotice(fallback);
          setErrorMessage(
            fallback ? '서버 데이터 연결 전까지 임시 공지사항이 표시됩니다.' : '공지사항을 찾을 수 없습니다.',
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadNoticeDetail();

    return () => {
      ignore = true;
    };
  }, [noticeId]);

  if (isLoading) {
    return (
      <section className={`page-section ${styles.page}`}>
        <p>데이터를 불러오는 중입니다.</p>
      </section>
    );
  }

  if (!notice) {
    return (
      <section className={`page-section ${styles.page}`}>
        <p>{errorMessage || '공지사항을 찾을 수 없습니다.'}</p>
        <div className={styles.listButtonRow}>
          <Link className={styles.listButton} to="/notices">
            공지사항 목록
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`page-section ${styles.page}`}>
      <div className={styles.headerRow}>
        <h1>공지사항</h1>
      </div>

      <div className={styles.divider} />

      {errorMessage ? <div className="status-banner">{errorMessage}</div> : null}

      <div className={styles.articleHeader}>
        <h2>{notice.title}</h2>
        <p className={styles.date}>{formatDate(notice.createdAt)}</p>
      </div>

      <div className={styles.divider} />

      <div className={styles.content}>{notice.content}</div>

      <div className={styles.neighborNav}>
        <div className={styles.neighborRow}>
          <span className={styles.neighborLabel}>이전 ▲</span>
          {notice.prevNotice ? (
            <Link to={`/notices/${notice.prevNotice.noticeId}`}>{notice.prevNotice.title}</Link>
          ) : (
            <span className={styles.neighborEmpty}>이전 글이 없습니다.</span>
          )}
        </div>
        <div className={styles.neighborRow}>
          <span className={styles.neighborLabel}>다음 ▼</span>
          {notice.nextNotice ? (
            <Link to={`/notices/${notice.nextNotice.noticeId}`}>{notice.nextNotice.title}</Link>
          ) : (
            <span className={styles.neighborEmpty}>다음 글이 없습니다.</span>
          )}
        </div>
      </div>

      <div className={styles.listButtonRow}>
        <Link className={styles.listButton} to="/notices">
          공지사항 목록
        </Link>
      </div>
    </section>
  );
}
