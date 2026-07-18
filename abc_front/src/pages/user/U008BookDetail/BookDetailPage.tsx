// 도서 상세 화면(U008) — 도서 정보 조회, 찜하기, 리뷰 작성/수정/삭제, 신고 모달을 담당한다.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AUTH_CHANGED_EVENT } from '../../../api/authApi';
import { getBookDetail, getRelatedBooks } from '../../../api/bookApi';
import { createMyFavorite, deleteMyFavorite } from '../../../api/favoritesApi';
import { getMyRentals } from '../../../api/myRentalsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { createReview, deleteReview, getBookReviews, updateReview } from '../../../api/reviewApi';
import { Modal } from '../../../components/common/Modal';
import type { BookDetail } from '../../../types/book';
import type { BookCard, MyRentalItem, ReviewItem, ReviewSummary } from '../../../types/api';
import styles from '../../../styles/BookDetailPage.module.css';

type DetailTab = 'description' | 'recommendations' | 'reviews';
type ModalType = 'login' | 'bookReport' | 'reviewReport' | null;

const REVIEW_PAGE_SIZE = 50;

function formatReviewDate(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

function formatStars(score: number) {
  const clamped = Math.min(5, Math.max(0, score));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

function formatWon(value: number | undefined) {
  if (typeof value !== 'number') {
    return '-';
  }

  return `${value.toLocaleString('ko-KR')}원`;
}

function formatPageCount(value: number | undefined) {
  if (typeof value !== 'number') {
    return '-';
  }

  return `${value.toLocaleString('ko-KR')}쪽`;
}

function formatBookDate(value: string | undefined) {
  if (!value) {
    return '-';
  }

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

function formatKeywords(keywords: string[] | undefined) {
  return keywords && keywords.length > 0 ? keywords.join(', ') : '-';
}

function isRentedState(state: string | null | undefined) {
  return state === 'READY' || state === 'READING' || state === 'RENTED';
}

function isOwnedState(state: string | null | undefined) {
  return state === 'OWNED' || state === 'PURCHASED';
}

function getReadPath(rental: MyRentalItem) {
  return `/rentals/${rental.rentalId}/read`;
}

function StarPicker({ value, onChange, disabled = false }: { value: number; onChange: (rating: number) => void; disabled?: boolean }) {
  return (
    <div className={styles.starPicker} aria-label="별점 선택">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          className={rating <= value ? styles.starActive : ''}
          type="button"
          key={rating}
          disabled={disabled}
          onClick={() => onChange(rating)}
          aria-label={`${rating}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function BookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [isSignedIn, setIsSignedIn] = useState(() => Boolean(localStorage.getItem('accessToken')));
  const [currentMemberId, setCurrentMemberId] = useState(() => Number(localStorage.getItem('memberId')) || null);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState('');
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportNotice, setReportNotice] = useState('');
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewListError, setReviewListError] = useState('');
  const [openReviewMenuId, setOpenReviewMenuId] = useState<number | null>(null);
  const [sameAuthorBooks, setSameAuthorBooks] = useState<BookCard[]>([]);
  const [sameCategoryBooks, setSameCategoryBooks] = useState<BookCard[]>([]);
  const [bookActionMessage, setBookActionMessage] = useState('');
  const [isOpeningViewer, setIsOpeningViewer] = useState(false);
  const [myBookRental, setMyBookRental] = useState<MyRentalItem | null>(null);

  const myReview = reviewItems.find((review) => review.memberId === currentMemberId) ?? null;
  const myBookRentalState = myBookRental?.rentalStatus ?? book?.myRentalState;
  const isRentedBook = isRentedState(myBookRentalState);
  const isOwnedBook = isOwnedState(myBookRentalState);

  useEffect(() => {
    function syncAuthState() {
      setIsSignedIn(Boolean(localStorage.getItem('accessToken')));
      setCurrentMemberId(Number(localStorage.getItem('memberId')) || null);
    }

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);
    window.addEventListener('storage', syncAuthState);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  async function loadReviews() {
    if (!bookId) return;

    try {
      // API-REVIEW-001에는 "내 리뷰만 조회"하는 별도 파라미터가 없어서, 목록에서 직접
      // memberId로 내 리뷰를 찾는다. 리뷰가 매우 많은 도서는 내 리뷰가 이 페이지 밖에 있을 수 있다.
      const data = await getBookReviews(Number(bookId), { page: 0, size: REVIEW_PAGE_SIZE, sort: 'latest' });
      setReviewSummary(data.summary);
      setReviewItems(data.reviews.content);
      setReviewListError('');
    } catch (error) {
      setReviewListError(getApiErrorMessage(error));
    }
  }

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
        setIsFavorite(false);
      } catch {
        setErrorMessage('도서 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadBookDetail();
  }, [bookId]);

  useEffect(() => {
    void loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  useEffect(() => {
    if (!bookId || !isSignedIn) {
      setMyBookRental(null);
      return;
    }

    let ignore = false;

    async function loadMyBookRental() {
      try {
        const rentalsPage = await getMyRentals({ page: 0, size: 100 });
        const currentRental = rentalsPage.content.find((rental) => rental.bookId === Number(bookId)) ?? null;

        if (!ignore) {
          setMyBookRental(currentRental);
        }
      } catch {
        if (!ignore) {
          setMyBookRental(null);
        }
      }
    }

    void loadMyBookRental();

    return () => {
      ignore = true;
    };
  }, [bookId, isSignedIn, currentMemberId]);

  useEffect(() => {
    if (!bookId) return;
    let ignore = false;

    getRelatedBooks(Number(bookId), 'AUTHOR', 6)
      .then((books) => {
        if (!ignore) setSameAuthorBooks(books);
      })
      .catch(() => {
        if (!ignore) setSameAuthorBooks([]);
      });

    getRelatedBooks(Number(bookId), 'CATEGORY', 6)
      .then((books) => {
        if (!ignore) setSameCategoryBooks(books);
      })
      .catch(() => {
        if (!ignore) setSameCategoryBooks([]);
      });

    return () => {
      ignore = true;
    };
  }, [bookId]);

  async function handleFavoriteClick() {
    if (!bookId) return;

    if (!isSignedIn) {
      setActiveModal('login');
      return;
    }

    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    setFavoriteMessage('');

    try {
      if (nextFavorite) {
        await createMyFavorite(Number(bookId));
      } else {
        await deleteMyFavorite(Number(bookId));
      }
    } catch {
      setIsFavorite(!nextFavorite);
      setFavoriteMessage('찜하기 처리에 실패했습니다.');
    }
  }

  function handleRentClick() {
    if (!bookId) return;

    if (!isSignedIn) {
      setActiveModal('login');
      return;
    }

    navigate(`/books/${bookId}/rent`);
  }

  async function handleReadClick() {
    if (!bookId) return;

    if (!isSignedIn) {
      setActiveModal('login');
      return;
    }

    setIsOpeningViewer(true);
    setBookActionMessage('');

    try {
      const currentRental =
        myBookRental ??
        (await getMyRentals({ page: 0, size: 100 })).content.find((rental) => rental.bookId === Number(bookId));

      if (!currentRental) {
        setBookActionMessage('내 서재에서 대여/소장 상태를 확인해 주세요.');
        return;
      }

      navigate(getReadPath(currentRental));
    } catch (error) {
      setBookActionMessage(getApiErrorMessage(error));
    } finally {
      setIsOpeningViewer(false);
    }
  }

  function openMemberModal(modalType: Exclude<ModalType, null>) {
    if (!isSignedIn) {
      setActiveModal('login');
      return;
    }

    setReportReason('');
    setReportContent('');
    setReportNotice('');
    setActiveModal(modalType);
  }

  function openReviewEditor() {
    if (!isSignedIn) {
      setActiveModal('login');
      return;
    }

    setOpenReviewMenuId(null);
    setReviewRating(myReview?.ratingScore ?? 0);
    setReviewContent(myReview?.content ?? '');
    setReviewNotice('');
    setIsReviewModalOpen(true);
  }

  async function handleSubmitReview() {
    if (!reviewRating || !reviewContent.trim()) {
      setReviewNotice('별점과 리뷰 내용을 입력해 주세요.');
      return;
    }

    if (!bookId) return;

    setIsSubmittingReview(true);
    setReviewNotice('');

    try {
      if (myReview) {
        await updateReview(myReview.reviewId, { content: reviewContent.trim() });
      } else {
        await createReview({ bookId: Number(bookId), ratingScore: reviewRating, content: reviewContent.trim() });
      }

      setIsReviewModalOpen(false);
      await loadReviews();
    } catch (error) {
      setReviewNotice(getApiErrorMessage(error));
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleDeleteReview() {
    if (!myReview) return;

    setOpenReviewMenuId(null);

    try {
      await deleteReview(myReview.reviewId);
      await loadReviews();
    } catch (error) {
      setReviewListError(getApiErrorMessage(error));
    }
  }

  function handleSubmitReport() {
    if (!reportReason || !reportContent.trim()) {
      setReportNotice('신고 사유와 신고 내용을 입력해 주세요.');
      return;
    }

    setReportNotice('신고 등록 API 연결 후 처리됩니다.');
  }

  function closeReportModal() {
    setActiveModal(null);
    setReportReason('');
    setReportContent('');
    setReportNotice('');
  }

  if (loading) {
    return (
      <section className={`page-section ${styles.page}`}>
        <p>데이터를 불러오는 중입니다.</p>
      </section>
    );
  }

  return (
    <section className={`page-section ${styles.page}`}>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <section className={styles.hero} aria-labelledby="book-detail-title">
        <div className={styles.left}>
          <div className={styles.cover}>
            {book?.coverImageUrl ? <img src={book.coverImageUrl} alt={book.title} /> : <span>표지 영역</span>}
          </div>

          <button
            className={`${styles.favorite} ${isFavorite ? styles.active : ''}`}
            type="button"
            onClick={handleFavoriteClick}
            aria-pressed={isFavorite}
          >
            {isFavorite ? '♥ 찜하기' : '♡ 찜하기'}
          </button>
          {favoriteMessage && <p className={styles.favoriteMessage}>{favoriteMessage}</p>}
        </div>

        <div className={styles.info}>
          <h1 id="book-detail-title">{book?.title ?? '도서 정보가 없습니다.'}</h1>

          <dl className={styles.meta}>
            <div>
              <dt>작가</dt>
              <dd>{book?.author ?? '-'}</dd>
            </div>
            <div>
              <dt>출판사</dt>
              <dd>{book?.publisher ?? '-'}</dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>{book?.isbn ?? '-'}</dd>
            </div>
            <div>
              <dt>장르</dt>
              <dd>{book?.categoryName ?? '-'}</dd>
            </div>
            <div>
              <dt>페이지 수</dt>
              <dd>{formatPageCount(book?.pageCount)}</dd>
            </div>
            <div>
              <dt>유료 / 무료</dt>
              <dd className={styles.inlineValue}>
                {book ? <span className={styles.chip}>{book.rentalType === 'FREE' ? '무료' : '유료'}</span> : '-'}
              </dd>
            </div>
            <div>
              <dt>대여 금액</dt>
              <dd>{book?.rentalType === 'FREE' ? '0원' : formatWon(book?.rentalPrice)}</dd>
            </div>
            <div>
              <dt>대여 가능일</dt>
              <dd>{book ? '결제 완료 즉시' : '-'}</dd>
            </div>
            <div>
              <dt>반납 예정일</dt>
              <dd>{typeof book?.rentalPeriodDays === 'number' ? `대여 시작일로부터 ${book.rentalPeriodDays}일 후` : '-'}</dd>
            </div>
          </dl>

          <div className={styles.intro}>
            <strong>책 소개</strong>
            <p>{book?.description ?? '도서 상세 정보를 불러오면 책 소개가 표시됩니다.'}</p>
          </div>

          <div className={styles.tags} aria-label="키워드">
            {book?.keywords && book.keywords.length > 0 ? book.keywords.map((keyword) => <span key={keyword}>{keyword}</span>) : <span>키워드 없음</span>}
          </div>
        </div>

        <aside className={styles.actionPanel} aria-label="도서 활동">
          {isRentedBook ? (
            <button className="button button-primary" type="button" onClick={handleReadClick} disabled={isOpeningViewer}>
              {isOpeningViewer ? '이동 중' : '읽기'}
            </button>
          ) : (
            <button className="button button-primary" type="button" onClick={handleRentClick} disabled={isOwnedBook}>
              대여하기
            </button>
          )}
          {isOwnedBook ? (
            <button className="button button-secondary" type="button" onClick={handleReadClick} disabled={isOpeningViewer}>
              {isOpeningViewer ? '이동 중' : '읽기'}
            </button>
          ) : (
            <button className="button button-secondary" type="button" onClick={handleRentClick}>
              소장하기
            </button>
          )}
          {bookActionMessage && <p className={styles.bookActionMessage}>{bookActionMessage}</p>}

          <div className={styles.sideLinks}>
            <button type="button" onClick={() => openMemberModal('bookReport')}>
              <span>책 신고하기</span>
            </button>
            <Link to={`/books/${bookId}/libraries`}>
              <span>도서관 위치 확인</span>
            </Link>
            <button type="button" onClick={openReviewEditor}>
              <span>나의 리뷰 작성</span>
            </button>
          </div>
        </aside>
      </section>

      <nav className={styles.tabs} aria-label="도서 상세 탭">
        <a
          className={activeTab === 'description' ? styles.tabActive : ''}
          href="#book-description"
          onClick={() => setActiveTab('description')}
        >
          책 소개
        </a>
        <a
          className={activeTab === 'recommendations' ? styles.tabActive : ''}
          href="#book-recommendations"
          onClick={() => setActiveTab('recommendations')}
        >
          책 추천
        </a>
        <a className={activeTab === 'reviews' ? styles.tabActive : ''} href="#book-reviews" onClick={() => setActiveTab('reviews')}>
          리뷰
        </a>
      </nav>

      <section className={styles.section} id="book-description">
        <h2>상세 정보</h2>
        <dl className={styles.spec}>
          <div>
            <dt>ISBN</dt>
            <dd>{book?.isbn ?? '-'}</dd>
          </div>
          <div>
            <dt>출판사</dt>
            <dd>{book?.publisher ?? '-'}</dd>
          </div>
          <div>
            <dt>발행일</dt>
            <dd>{formatBookDate(book?.publishedAt)}</dd>
          </div>
          <div>
            <dt>파일 형식</dt>
            <dd>{book?.fileFormat ?? '-'}</dd>
          </div>
          <div>
            <dt>지원 기기</dt>
            <dd>{book?.supportedDevice ?? '-'}</dd>
          </div>
          <div>
            <dt>언어</dt>
            <dd>{book?.language ?? '-'}</dd>
          </div>
          <div>
            <dt>카테고리</dt>
            <dd>{book?.categoryName ?? '-'}</dd>
          </div>
          <div>
            <dt>키워드</dt>
            <dd>{formatKeywords(book?.keywords)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} id="book-recommendations">
        <div className={styles.rowTitle}>
          <h2>같은 작가의 다른 책</h2>
          <Link to={`/books/${bookId}/recommendations?type=AUTHOR`}>더보기</Link>
        </div>
        {sameAuthorBooks.length > 0 ? (
          <div className={styles.bookGrid} aria-label="같은 작가의 다른 책 목록">
            {sameAuthorBooks.map((related) => (
              <Link className={styles.bookCard} to={`/books/${related.bookId}`} key={related.bookId}>
                {related.coverImageUrl ? <img className={styles.bookThumb} src={related.coverImageUrl} alt="" /> : <span className={styles.bookThumb}>표지</span>}
                <strong>{related.title}</strong>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>같은 작가의 다른 책이 없습니다.</p>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.rowTitle}>
          <h2>같은 장르의 다른 책</h2>
          <Link to={`/books/${bookId}/recommendations?type=CATEGORY`}>더보기</Link>
        </div>
        {sameCategoryBooks.length > 0 ? (
          <div className={styles.bookGrid} aria-label="같은 장르의 다른 책 목록">
            {sameCategoryBooks.map((related) => (
              <Link className={styles.bookCard} to={`/books/${related.bookId}`} key={related.bookId}>
                {related.coverImageUrl ? <img className={styles.bookThumb} src={related.coverImageUrl} alt="" /> : <span className={styles.bookThumb}>표지</span>}
                <strong>{related.title}</strong>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>같은 장르의 다른 책이 없습니다.</p>
        )}
      </section>

      <section className={styles.section} id="book-reviews">
        <div className={styles.reviewHeader}>
          <h2>리뷰</h2>
          <button className="button button-secondary" type="button" onClick={openReviewEditor}>
            {myReview ? '나의 리뷰 수정' : '나의 리뷰 작성'}
          </button>
        </div>

        <div className={styles.reviewSummary}>
          {reviewSummary && reviewSummary.reviewCount > 0 ? (
            <p>
              <span className={styles.stars}>{formatStars(Math.round(reviewSummary.averageRating))}</span>{' '}
              {reviewSummary.averageRating.toFixed(1)}점 · 리뷰 {reviewSummary.reviewCount}건
            </p>
          ) : (
            <p className={styles.emptyState}>등록된 평점이 없습니다.</p>
          )}
        </div>

        <div className={styles.reviewList}>
          <h3>이 책을 읽은 독자들의 한 줄 소감평</h3>
          {reviewListError ? <p className={styles.emptyState}>{reviewListError}</p> : null}
          {!reviewListError && reviewItems.length === 0 ? (
            <p className={styles.emptyState}>등록된 리뷰가 없습니다.</p>
          ) : null}
          {reviewItems.length > 0 ? (
            <div className={styles.reviewRows}>
              {reviewItems.map((review) => (
                <div className={styles.reviewRow} key={review.reviewId}>
                  <div className={styles.reviewProfile} aria-hidden="true" />
                  <div className={styles.reviewBody}>
                    <strong>{review.memberName}</strong>
                    <p>{review.content}</p>
                  </div>
                  <span className={styles.stars} aria-label={`별점 ${review.ratingScore}점`}>
                    {formatStars(review.ratingScore)}
                  </span>
                  <span className={styles.reviewDate}>{formatReviewDate(review.createdAt)}</span>
                  {review.memberId === currentMemberId ? (
                    <div className={styles.reviewMenu}>
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={openReviewMenuId === review.reviewId}
                        onClick={() => setOpenReviewMenuId((current) => (current === review.reviewId ? null : review.reviewId))}
                      >
                        ⋯
                      </button>
                      {openReviewMenuId === review.reviewId ? (
                        <div className={styles.reviewMenuPanel} role="menu">
                          <button type="button" onClick={openReviewEditor}>
                            수정
                          </button>
                          <button type="button" onClick={handleDeleteReview}>
                            삭제
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={myReview ? '나의 리뷰 수정' : '나의 리뷰 작성'}
      >
        <p className={styles.modalMessage}>이 책은 어떠셨나요?</p>
        <StarPicker value={reviewRating} onChange={setReviewRating} disabled={Boolean(myReview)} />
        {myReview ? <p className={styles.modalMessage}>별점은 최초 작성 이후 수정할 수 없습니다.</p> : null}

        <div className={styles.formFields}>
          <label>
            리뷰 내용
            <textarea
              value={reviewContent}
              onChange={(event) => setReviewContent(event.target.value)}
              placeholder="이 책에 대한 감상을 남겨주세요. 다른 독자들에게 큰 도움이 됩니다."
            />
          </label>
        </div>
        {reviewNotice && <p className={styles.modalMessage}>{reviewNotice}</p>}

        <div className={styles.modalActions}>
          <button className="button button-primary" type="button" onClick={handleSubmitReview} disabled={isSubmittingReview}>
            {isSubmittingReview ? '처리 중...' : myReview ? '리뷰 수정' : '리뷰 등록'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'login'} onClose={() => setActiveModal(null)} title="회원 전용 기능입니다">
        <p className={styles.modalMessage}>로그인/회원가입 후 이용할 수 있습니다.</p>
        <div className={styles.modalActions}>
          <Link className="button button-primary" to="/login">
            예
          </Link>
          <button className="button button-secondary" type="button" onClick={() => setActiveModal(null)}>
            아니오
          </button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'bookReport'} onClose={closeReportModal} title="책 신고하기">
        <div className={styles.formFields}>
          <label>
            신고 사유
            <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
              <option value="">신고 사유를 선택하세요.</option>
              <option>책의 오류 및 수정</option>
              <option>제목과 다른 책 내용</option>
              <option>혐오 또는 불쾌한 내용</option>
            </select>
          </label>

          <label>
            신고 내용
            <textarea value={reportContent} onChange={(event) => setReportContent(event.target.value)} placeholder="신고 내용을 입력해 주세요." />
          </label>
        </div>
        {reportNotice && <p className={styles.modalMessage}>{reportNotice}</p>}

        <div className={styles.modalActions}>
          {reportNotice ? (
            <button className="button button-secondary" type="button" onClick={closeReportModal}>
              닫기
            </button>
          ) : (
            <button className="button button-primary" type="button" onClick={handleSubmitReport}>
              신고 등록
            </button>
          )}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'reviewReport'} onClose={closeReportModal} title="리뷰 신고하기">
        <div className={styles.formFields}>
          <label>
            신고 사유
            <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
              <option value="">신고 사유를 선택하세요.</option>
              <option>욕설 및 비방</option>
              <option>스포일러</option>
              <option>불쾌함</option>
            </select>
          </label>

          <label>
            신고 내용
            <textarea value={reportContent} onChange={(event) => setReportContent(event.target.value)} placeholder="신고 내용을 입력해 주세요." />
          </label>
        </div>
        {reportNotice && <p className={styles.modalMessage}>{reportNotice}</p>}

        <div className={styles.modalActions}>
          {reportNotice ? (
            <button className="button button-secondary" type="button" onClick={closeReportModal}>
              닫기
            </button>
          ) : (
            <button className="button button-primary" type="button" onClick={handleSubmitReport}>
              신고 등록
            </button>
          )}
        </div>
      </Modal>
    </section>
  );
}
