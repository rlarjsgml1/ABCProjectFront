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

  const displayBook: BookDetail = book ?? {
    bookId: Number(bookId ?? 0),
    title: '책 제목 입니다',
    author: '이름',
    publisher: '출판사 이름',
    description: '소개합니다 소개합니다 소개적어요 소개적어요 소개적어요',
    coverImageUrl: '',
    rentalType: 'FREE',
    status: 'AVAILABLE',
  };

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

  return (
    <section className="page-section book-detail-page">
      <p className="eyebrow">U-008</p>

      {errorMessage && <p className="book-detail-error">{errorMessage}</p>}

      <section className="book-detail-hero" aria-labelledby="book-detail-title">
        <div className="book-detail-left">
          <div className="book-detail-cover">
            {displayBook.coverImageUrl ? <img src={displayBook.coverImageUrl} alt={displayBook.title} /> : <span>표지 영역</span>}
          </div>

          <button className="book-detail-favorite" type="button">
            ♡ 찜하기
          </button>
        </div>

        <div className="book-detail-info">
          <h1 id="book-detail-title">{displayBook.title}</h1>

          <dl className="book-detail-meta">
            <div>
              <dt>작가</dt>
              <dd>{displayBook.author}</dd>
            </div>
            <div>
              <dt>출판사</dt>
              <dd>{displayBook.publisher}</dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>12348556456</dd>
            </div>
            <div>
              <dt>장르</dt>
              <dd>장르 적기</dd>
            </div>
            <div>
              <dt>페이지 수</dt>
              <dd>페이지 수 숫자 p</dd>
            </div>
            <div>
              <dt>유료 / 무료</dt>
              <dd>
                <span className="book-detail-chip">{displayBook.rentalType === 'FREE' ? '무료' : '유료'}</span>
              </dd>
            </div>
            <div>
              <dt>대여 가능일</dt>
              <dd>7일</dd>
            </div>
            <div>
              <dt>반납 예정일</dt>
              <dd>2026.02.05</dd>
            </div>
          </dl>

          <div className="book-detail-intro">
            <strong>책 소개</strong>
            <p>{displayBook.description}</p>
          </div>

          <div className="book-detail-tags" aria-label="키워드">
            <span># 판타지</span>
            <span># 로맨스</span>
            <span># 취미생활</span>
            <span># 성장</span>
          </div>
        </div>

        <aside className="book-detail-action-panel" aria-label="도서 활동">
          <Link className="button button-primary" to={`/books/${bookId}/rent`}>
            ▣ 대여하기
          </Link>
          <button className="button button-secondary" type="button">
            ▣ 소장하기
          </button>

          <div className="book-detail-side-links">
            <button type="button">⚐ 책 신고하기</button>
            <Link to={`/books/${bookId}/libraries`}>♡ 도서관 위치 확인</Link>
            <button type="button" onClick={() => setIsReviewModalOpen(true)}>
              ✎ 나의 리뷰 작성
            </button>
          </div>
        </aside>
      </section>

      <nav className="book-detail-tabs" aria-label="도서 상세 탭">
        <a href="#book-description">책 소개</a>
        <a href="#book-recommendations">책 추천</a>
        <a href="#book-reviews">리뷰</a>
      </nav>

      <section className="book-detail-section" id="book-description">
        <h2>상세 정보</h2>
        <dl className="book-detail-spec">
          <div>
            <dt>ISBN</dt>
            <dd>989-11-678923-7-3</dd>
          </div>
          <div>
            <dt>출판사</dt>
            <dd>{displayBook.publisher}</dd>
          </div>
          <div>
            <dt>발행일</dt>
            <dd>2025.09.04</dd>
          </div>
          <div>
            <dt>파일 형식</dt>
            <dd>EPUB, PDF</dd>
          </div>
          <div>
            <dt>지원 기기</dt>
            <dd>PC, 모바일, 태블릿</dd>
          </div>
          <div>
            <dt>언어</dt>
            <dd>한국어</dd>
          </div>
          <div>
            <dt>카테고리</dt>
            <dd>판타지, 로맨스</dd>
          </div>
          <div>
            <dt>키워드</dt>
            <dd>기억, 첫사랑, 성장</dd>
          </div>
        </dl>
      </section>

      <section className="book-detail-section" id="book-recommendations">
        <div className="book-detail-row-title">
          <h2>같은 작가의 다른 책</h2>
          <Link to={`/books/${bookId}/recommendations`}>더보기</Link>
        </div>
        <div className="book-detail-book-row">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <article className="book-detail-small-card" key={`author-${item}`}>
              <div aria-hidden="true" />
              <strong>책 제목</strong>
              <span>작가 이름</span>
            </article>
          ))}
        </div>
      </section>

      <section className="book-detail-section">
        <div className="book-detail-row-title">
          <h2>같은 장르의 다른 책</h2>
          <Link to={`/books/${bookId}/recommendations`}>더보기</Link>
        </div>
        <div className="book-detail-book-row">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <article className="book-detail-small-card" key={`genre-${item}`}>
              <div aria-hidden="true" />
              <strong>책 제목</strong>
              <span>작가 이름</span>
            </article>
          ))}
        </div>
      </section>

      <section className="book-detail-section" id="book-reviews">
        <h2>다람쥐's 리뷰 (182)</h2>

        <div className="book-detail-review-summary">
          <div>
            <strong>사용자총점</strong>
            <p className="book-detail-score">9.7 / 10</p>
            {[55, 30, 2, 5, 8].map((score, index) => (
              <div className="book-detail-rating-row" key={score + index}>
                <span>{5 - index}점</span>
                <div>
                  <span style={{ width: `${score}%` }} />
                </div>
                <em>{score}%</em>
              </div>
            ))}
          </div>

          <div>
            <strong>10대의 사용자가 가장 많이 감상했어요</strong>
            <div className="book-detail-age-chart">
              {[55, 30, 2, 5, 8].map((score, index) => (
                <div key={score + index}>
                  <span style={{ height: `${score}%` }} />
                  <em>{['10대', '20대', '30대', '40대', '50대 이상'][index]}</em>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="book-detail-review-list">
          <h3>이 책을 읽은 독자들의 한 줄 소감평</h3>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <article className="book-detail-review-item" key={item}>
              <div aria-hidden="true" />
              <div>
                <strong>책벌레 234님</strong>
                <span>★★★★★</span>
              </div>
              <p>한 문장 한 문장이 그림처럼 아름다워요. 추천해요.</p>
              <time>2026.0{item}.28</time>
              <button type="button" aria-label="리뷰 더보기">
                ⋮
              </button>
            </article>
          ))}
        </div>
      </section>

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
