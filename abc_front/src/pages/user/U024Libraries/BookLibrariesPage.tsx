// 책 보유 도서관 위치(U024) 화면 — 지도 SDK 선택 전까지 주소 목록 중심으로 보여준다.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBookLibraries } from '../../../api/libraryApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { EmptyState } from '../../../components/common/EmptyState';
import type { LibrarySummaryItem } from '../../../types/api';
import styles from '../../../styles/BookLibrariesPage.module.css';

const holdingStatusLabels: Record<string, string> = {
  AVAILABLE: '이용 가능',
  UNAVAILABLE: '이용 불가',
};

export function BookLibrariesPage() {
  const { bookId } = useParams();
  const [libraries, setLibraries] = useState<LibrarySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadLibraries() {
      if (!bookId) {
        setErrorMessage('도서 ID가 없습니다.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getBookLibraries(Number(bookId));
        if (!ignore) setLibraries(data);
      } catch (error) {
        if (!ignore) setErrorMessage(getApiErrorMessage(error));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadLibraries();

    return () => {
      ignore = true;
    };
  }, [bookId]);

  const bookTitle = libraries[0]?.title;

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="book-libraries-title">
      <div className="section-heading-row">
        <div>
          <h1 id="book-libraries-title">{bookTitle ?? '도서'} 보유 도서관</h1>
        </div>
        {bookId ? <Link to={`/books/${bookId}`}>도서 상세로</Link> : null}
      </div>

      {isLoading ? <div className="status-banner">도서관 정보를 불러오는 중입니다.</div> : null}
      {!isLoading && errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

      {!isLoading && !errorMessage && libraries.length === 0 ? (
        <EmptyState title="이 책을 보유한 도서관이 없습니다." description="다른 도서를 확인해 보세요." />
      ) : null}

      {!isLoading && !errorMessage && libraries.length > 0 ? (
        <ul className={styles.libraryList} aria-label="보유 도서관 목록">
          {libraries.map((library) => (
            <li className={styles.libraryItem} key={`${library.libraryName}-${library.address}`}>
              <div>
                <strong>{library.libraryName}</strong>
                <p>{library.address}</p>
              </div>
              <span className={`${styles.statusBadge} ${library.holdingStatus === 'AVAILABLE' ? styles.statusAvailable : styles.statusUnavailable}`}>
                {holdingStatusLabels[library.holdingStatus] ?? library.holdingStatus}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
