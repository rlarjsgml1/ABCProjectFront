import { useEffect, useState } from 'react';
import { getBooks } from '../../../api/bookApi';
import { EmptyState } from '../../../components/common/EmptyState';
import type { BookCard } from '../../../types/api';

function formatRentalPrice(price: number) {
  return price > 0 ? `${price.toLocaleString('ko-KR')}원` : '무료';
}

function formatRating(rating: number) {
  return rating.toFixed(1);
}

export function BooksPage() {
  const [book, setBook] = useState<BookCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadBooks() {
      try {
        const data = await getBooks(0, 1);
        if (!ignore) {
          setBook(data.content[0] ?? null);
          setErrorMessage('');
        }
      } catch {
        if (!ignore) {
          setBook(null);
          setErrorMessage('도서 목록을 불러오지 못했습니다. 잠시 후 다시 시도하세요.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadBooks();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="page-section">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">U-006</p>
          <h1>도서 목록</h1>
        </div>
        <span>최신 도서</span>
      </div>
      <p>현재 등록된 도서 중 하나를 API에서 불러와 표시합니다.</p>

      {isLoading ? <div className="status-banner">도서 목록을 불러오는 중입니다.</div> : null}
      {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}
      {!isLoading && !errorMessage && !book ? (
        <EmptyState title="표시할 도서가 없습니다." description="등록된 도서가 생기면 이곳에 표시됩니다." />
      ) : null}

      {book ? (
        <div className="library-preview-list" aria-label="도서 목록">
          <article className="library-preview-item">
            <p className="eyebrow">BOOK #{book.bookId}</p>
            <h2>{book.title}</h2>
            <p>저자: {book.authors.join(', ')}</p>
            <p>출판사: {book.publisherName}</p>
            <div className="count-card-grid" aria-label="대여와 리뷰 요약">
              <div className="count-card">
                <strong>{book.rentalType}</strong>
                <span>대여 유형</span>
              </div>
              <div className="count-card">
                <strong>{formatRentalPrice(book.rentalPrice)}</strong>
                <span>대여 가격</span>
              </div>
              <div className="count-card">
                <strong>{formatRating(book.averageRating)}</strong>
                <span>평점 · 리뷰 {book.reviewCount}개</span>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
