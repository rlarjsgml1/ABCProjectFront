// 추천 도서 목록(U025) 화면 — 도서 상세의 "같은 작가/장르의 다른 책" 더보기 진입점. 카드 클릭 시 도서 상세(U008)로 이동한다.
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getRelatedBooks } from '../../../api/bookApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { EmptyState } from '../../../components/common/EmptyState';
import type { BookCard, BookRecommendationType } from '../../../types/api';

const typeTitles: Record<BookRecommendationType, string> = {
  AUTHOR: '같은 작가의 다른 책',
  CATEGORY: '같은 장르의 다른 책',
  KEYWORD: '비슷한 키워드의 다른 책',
};

function resolveType(value: string | null): BookRecommendationType {
  return value === 'AUTHOR' || value === 'CATEGORY' || value === 'KEYWORD' ? value : 'AUTHOR';
}

export function RecommendedBooksPage() {
  const { bookId } = useParams();
  const [searchParams] = useSearchParams();
  const type = resolveType(searchParams.get('type'));
  const [books, setBooks] = useState<BookCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadRelatedBooks() {
      if (!bookId) {
        setErrorMessage('도서 ID가 없습니다.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getRelatedBooks(Number(bookId), type, 20);
        if (!ignore) setBooks(data);
      } catch (error) {
        if (!ignore) setErrorMessage(getApiErrorMessage(error));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadRelatedBooks();

    return () => {
      ignore = true;
    };
  }, [bookId, type]);

  return (
    <div className="books-page">
      <section className="books-section-more-hero" aria-label={typeTitles[type]}>
        <div>
          <h1>{typeTitles[type]}</h1>
        </div>
        <div className="books-section-more-visual" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="books-section-more-content">
        <h2>전체 {books.length.toLocaleString('ko-KR')}건</h2>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}
        {isLoading ? <div className="status-banner">추천 도서를 불러오는 중입니다.</div> : null}

        {!isLoading && !errorMessage && books.length === 0 ? (
          <EmptyState title="추천할 도서가 없습니다." description="다른 도서 목록을 확인해보세요." />
        ) : null}

        {!isLoading && books.length > 0 ? (
          <div className="books-section-more-grid" aria-label={`${typeTitles[type]} 목록`}>
            {books.map((book) => (
              <Link className="books-section-more-card" to={`/books/${book.bookId}`} key={book.bookId}>
                {book.coverImageUrl ? <img src={book.coverImageUrl} alt="" /> : <span />}
                <strong>{book.title}</strong>
                <small>{book.authors.join(', ') || book.publisherName}</small>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
