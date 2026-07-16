// 내 서재 화면(U014) — 대여 중/소장 도서 현황을 보여주는 마이페이지 메인
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRentals } from '../../../api/myRentalsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { EmptyState } from '../../../components/common/EmptyState';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { MyRentalItem } from '../../../types/api';

const PREVIEW_SIZE = 3;

function formatProgressRate(progressRate: number) {
  return progressRate.toFixed(1);
}

export function MyPage() {
  const [readingBooks, setReadingBooks] = useState<MyRentalItem[]>([]);
  const [ownedBooks, setOwnedBooks] = useState<MyRentalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadPreview() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [readingPage, ownedPage] = await Promise.all([
          getMyRentals({ status: 'READING', page: 0, size: PREVIEW_SIZE }),
          getMyRentals({ status: 'OWNED', page: 0, size: PREVIEW_SIZE }),
        ]);

        if (!ignore) {
          setReadingBooks(readingPage.content);
          setOwnedBooks(ownedPage.content);
        }
      } catch (error) {
        if (!ignore) setErrorMessage(getApiErrorMessage(error));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadPreview();

    return () => {
      ignore = true;
    };
  }, []);

  const hasAnyBooks = readingBooks.length > 0 || ownedBooks.length > 0;

  return (
    <MyPageLayout titleId="mypage-library-title">
      <section className="page-section usage-history-panel">
        <div className="section-heading-row">
          <div>
            <h2 id="mypage-library-title">내 서재</h2>
          </div>
          <span>이용 현황</span>
        </div>
        <p>최근 대여/소장 도서 현황입니다. 전체 목록은 대여 현황에서 확인하세요.</p>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}
        {isLoading ? <div className="status-banner">이용 현황을 불러오는 중입니다.</div> : null}

        {!isLoading ? (
          <div className="library-preview-list" aria-label="내 서재 미리보기">
            <article className="library-preview-item">
              <h3>읽고 있는 도서</h3>
              {readingBooks.length > 0 ? (
                <div className="recent-books-list">
                  {readingBooks.map((book) => (
                    <article key={book.rentalId} className="recent-book-card">
                      <Link to={`/books/${book.bookId}`} className="recent-book-cover-link">
                        <img className="book-cover-thumb" src={book.coverImageUrl} alt={`${book.title} 표지`} />
                      </Link>

                      <div className="recent-book-info">
                        <Link to={`/books/${book.bookId}`} className="recent-book-title">
                          {book.title}
                        </Link>

                        <p className="recent-book-progress-text">
                          {book.currentPage} / {book.totalPages} 페이지 ({formatProgressRate(book.progressRate)}%)
                        </p>

                        <div className="recent-book-progress-track">
                          <span className="recent-book-progress-fill" style={{ width: `${book.progressRate}%` }} />
                        </div>
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
              ) : (
                <p>현재 읽고 있는 도서가 없습니다.</p>
              )}
              <Link to="/me/rentals">대여 현황 전체보기</Link>
            </article>

            <article className="library-preview-item">
              <h3>소장한 도서</h3>
              {ownedBooks.length > 0 ? (
                <div className="recent-books-list">
                  {ownedBooks.map((book) => (
                    <article key={book.rentalId} className="recent-book-card">
                      <Link to={`/books/${book.bookId}`} className="recent-book-cover-link">
                        <img className="book-cover-thumb" src={book.coverImageUrl} alt={`${book.title} 표지`} />
                      </Link>

                      <div className="recent-book-info">
                        <Link to={`/books/${book.bookId}`} className="recent-book-title">
                          {book.title}
                        </Link>

                        <p className="recent-book-progress-text">
                          {book.currentPage} / {book.totalPages} 페이지 ({formatProgressRate(book.progressRate)}%)
                        </p>

                        <div className="recent-book-progress-track">
                          <span className="recent-book-progress-fill" style={{ width: `${book.progressRate}%` }} />
                        </div>
                      </div>

                      <Link
                        to={`/rentals/${book.rentalId}/read?page=${book.currentPage > 0 ? book.currentPage : 1}`}
                        className="button button-primary recent-book-continue-button"
                      >
                        읽기
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p>소장한 도서가 없습니다.</p>
              )}
              <Link to="/me/rentals">대여 현황 전체보기</Link>
            </article>

            <article className="library-preview-item">
              <h3>나의 리뷰</h3>
              <p>작성한 리뷰와 별점 활동이 모이는 공간입니다.</p>
              <span aria-disabled="true">내 리뷰 목록 조회 API 준비 중</span>
            </article>
          </div>
        ) : null}

        {!isLoading && !errorMessage && !hasAnyBooks ? (
          <EmptyState title="표시할 이용 내역이 없습니다." description="도서를 대여하면 이 영역에서 독서 흐름을 확인할 수 있습니다." />
        ) : null}
      </section>
    </MyPageLayout>
  );
}
