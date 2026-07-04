import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBookDetail } from '../../../api/bookApi';
import type { BookDetail } from '../../../types/book';

export function BookDetailPage() {
  const { bookId } = useParams();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    async function loadBookDetail() {
      if (!bookId) {
        setErrorMessage('도서 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        const bookDetail = await getBookDetail(Number(bookId));
        setBook(bookDetail);
      } catch {
        setErrorMessage('도서 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadBookDetail();
  }, [bookId]);

  if (loading) {
    return (
      <section className="page-section book-detail-page">
        <p>데이터를 불러오는 중입니다.</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="page-section book-detail-page">
        <p>{errorMessage}</p>
      </section>
    );
  }

  return (
    <section className="page-section book-detail-page">
      <p className="eyebrow">U-008</p>
      <h1>도서 상세</h1>

      <p className="book-detail-id">선택한 도서 ID: {bookId ?? '미지정'}</p>

      {book ? (
        <div className="book-detail-layout">
          <div className="book-detail-cover">
            {book.coverImageUrl ? <img src={book.coverImageUrl} alt={book.title} /> : <span>표지 없음</span>}
          </div>

          <div className="book-detail-info">
            <h2>{book.title}</h2>
            <p>저자: {book.author}</p>
            <p>출판사: {book.publisher}</p>
            <p>대여 유형: {book.rentalType}</p>
            <p>상태: {book.status}</p>
            <p className="book-detail-description">{book.description}</p>
          </div>
        </div>
      ) : (
        <p className="book-detail-empty">도서 정보가 없습니다.</p>
      )}

      <div className="book-detail-actions">
        <Link className="button button-primary" to={`/books/${bookId}/rent`}>
          대여하기
        </Link>

        <button className="button button-secondary" type="button" onClick={() => setIsReviewModalOpen(true)}>
          나의 리뷰 작성
        </button>

        <Link className="button button-secondary" to={`/books/${bookId}/libraries`}>
          보유 도서관
        </Link>

        <Link className="button button-secondary" to={`/books/${bookId}/recommendations`}>
          추천 도서
        </Link>
      </div>

      {isReviewModalOpen && (
        <div className="review-modal-backdrop">
          <div className="review-modal">
            <h2>리뷰 작성/수정 영역</h2>

            <label>
              별점
              <input type="number" min="1" max="5" />
            </label>

            <label>
              리뷰 내용
              <textarea />
            </label>

            <div className="review-modal-actions">
              <button className="button button-primary" type="button">
                저장
              </button>
              <button className="button button-secondary" type="button" onClick={() => setIsReviewModalOpen(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
