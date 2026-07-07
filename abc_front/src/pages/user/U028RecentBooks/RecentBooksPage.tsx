import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecentBooks } from '../../../api/recentBooksApi';
import { getApiErrorMessage, getMyProfile } from '../../../api/profileApi';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { RecentBookItem, UserProfile } from '../../../types/api';

function formatProgress(current: number, total: number) {
  if (total <= 0) {
    return '0%';
  }

  return `${Math.min(100, Math.round((current / total) * 100))}%`;
}

function formatLastReadAt(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(time);
}

export function RecentBooksPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [recentBooks, setRecentBooks] = useState<RecentBookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const data = await getMyProfile();
        if (!ignore) {
          setProfile(data);
          setProfileError('');
        }
      } catch (error) {
        if (!ignore) {
          setProfile(null);
          setProfileError(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadRecentBooks() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getRecentBooks();
        if (!ignore) {
          setRecentBooks(data);
        }
      } catch (error) {
        if (!ignore) {
          setRecentBooks([]);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadRecentBooks();

    return () => {
      ignore = true;
    };
  }, []);

  const isEmpty = !isLoading && recentBooks.length === 0;

  return (
    <MyPageLayout profile={profile} isLoading={isProfileLoading} errorMessage={profileError} titleId="recent-books-title">
      <section className="page-section recent-books-page">
        <div className="section-heading-row">
          <div>
            <h2 id="recent-books-title">최근 읽은 책</h2>
          </div>
          <Link to="/me" className="recent-books-rental-link">
            내 대여 현황
          </Link>
        </div>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}
        {isLoading ? <div className="status-banner">최근 읽은 책을 불러오는 중입니다.</div> : null}

        {isEmpty ? (
          <div className="form-card recent-books-empty">
            <p>최근 읽은 책이 없습니다.</p>
            <Link to="/books" className="browse-button">
              도서 둘러보기
            </Link>
          </div>
        ) : null}

        {!isLoading && recentBooks.length > 0 ? (
          <div className="recent-books-list">
            {recentBooks.map((book) => (
              <article key={book.rentalId} className="recent-book-card">
                <Link to={`/books/${book.bookId}`} className="recent-book-cover-link">
                  <img className="book-cover-thumb" src={book.coverImageUrl} alt={`${book.title} 표지`} />
                </Link>

                <div className="recent-book-info">
                  <Link to={`/books/${book.bookId}`} className="recent-book-title">
                    {book.title}
                  </Link>

                  <p className="recent-book-progress-text">
                    {book.currentPage} / {book.totalPages} 페이지 ({formatProgress(book.currentPage, book.totalPages)})
                  </p>

                  <div className="recent-book-progress-track">
                    <span
                      className="recent-book-progress-fill"
                      style={{ width: formatProgress(book.currentPage, book.totalPages) }}
                    />
                  </div>

                  <p className="recent-book-last-read">마지막 읽은 시각 {formatLastReadAt(book.lastReadAt)}</p>
                </div>

                <Link
                  to={`/rentals/${book.rentalId}/read?page=${book.currentPage > 0 ? book.currentPage : 1}`}
                  className="button button-primary recent-book-continue-button"
                >
                  이어보기
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </MyPageLayout>
  );
}
