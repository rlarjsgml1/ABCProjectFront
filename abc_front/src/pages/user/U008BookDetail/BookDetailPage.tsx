import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBookDetail } from '../../../api/bookApi';
import { createMyFavorite, deleteMyFavorite } from '../../../api/favoritesApi';
import type { BookDetail } from '../../../types/book';
import styles from './BookDetailPage.module.css';

type DetailTab = 'description' | 'recommendations' | 'reviews';
type ModalType = 'login' | 'bookReport' | 'reviewReport' | 'deleteReview' | null;
type TestBookCard = {
  bookId: number;
  title: string;
  author: string;
};
type TestReview = {
  reviewId: number;
  nickname: string;
  role: string;
  rating: number;
  content: string;
  date: string;
  isMine: boolean;
  isEdited?: boolean;
};
type TestReport = {
  reportId: number;
  type: 'BOOK' | 'REVIEW';
  targetId: number;
  reason: string;
  content: string;
  createdAt: string;
};

const TEST_BOOK_DETAIL: BookDetail = {
  bookId: 1,
  title: '테스트 도서 제목',
  author: '테스트 작가',
  publisher: '테스트 출판사',
  description: '테스트 모드에서만 표시되는 도서 소개입니다.',
  coverImageUrl: '',
  rentalType: 'FREE',
  status: 'AVAILABLE',
};

const TEST_AUTHOR_RECOMMENDATIONS: TestBookCard[] = [
  { bookId: 2, title: '같은 작가 테스트 책 1', author: '테스트 작가' },
  { bookId: 3, title: '같은 작가 테스트 책 2', author: '테스트 작가' },
  { bookId: 4, title: '같은 작가 테스트 책 3', author: '테스트 작가' },
  { bookId: 8, title: '같은 작가 테스트 책 4', author: '테스트 작가' },
  { bookId: 9, title: '같은 작가 테스트 책 5', author: '테스트 작가' },
];

const TEST_GENRE_RECOMMENDATIONS: TestBookCard[] = [
  { bookId: 5, title: '같은 장르 테스트 책 1', author: '장르 작가' },
  { bookId: 6, title: '같은 장르 테스트 책 2', author: '장르 작가' },
  { bookId: 7, title: '같은 장르 테스트 책 3', author: '장르 작가' },
  { bookId: 10, title: '같은 장르 테스트 책 4', author: '장르 작가' },
  { bookId: 11, title: '같은 장르 테스트 책 5', author: '장르 작가' },
];

const TEST_REVIEWS: TestReview[] = [
  {
    reviewId: 1,
    nickname: '문학소녀',
    role: '사용자',
    rating: 4,
    content: '정말 정말 재미있어요. 강추합니다!',
    date: '2026.04.28',
    isMine: true,
  },
  {
    reviewId: 2,
    nickname: '책벌레 234님',
    role: '사용자',
    rating: 5,
    content: '아주 훌륭한 작품입니다. 별점 3점을 줬던 제가 후회되네요.',
    date: '2026.05.02',
    isMine: false,
    isEdited: true,
  },
];

function ModalShell({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기">
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return <span className={styles.stars}>{'★★★★★'.split('').map((star, index) => (index < rating ? star : '☆')).join('')}</span>;
}

function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <div className={styles.starPicker} aria-label="별점 선택">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          className={rating <= value ? styles.starActive : ''}
          type="button"
          key={rating}
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
  const isTestMode = new URLSearchParams(window.location.search).get('testMode') === '1';
  const isSignedIn = isTestMode || Boolean(localStorage.getItem('accessToken'));
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState('');
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeReviewMenuId, setActiveReviewMenuId] = useState<number | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [testReviewList, setTestReviewList] = useState<TestReview[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const [editReviewContent, setEditReviewContent] = useState('');
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportNotice, setReportNotice] = useState('');
  const [reportTargetReviewId, setReportTargetReviewId] = useState<number | null>(null);
  const testReviews = isTestMode ? testReviewList : [];
  const authorRecommendations = isTestMode ? TEST_AUTHOR_RECOMMENDATIONS : [];
  const genreRecommendations = isTestMode ? TEST_GENRE_RECOMMENDATIONS : [];
  const myReview = testReviews.find((review) => review.isMine);

  useEffect(() => {
    async function loadBookDetail() {
      if (!bookId) {
        setErrorMessage('도서 ID가 없습니다.');
        setLoading(false);
        return;
      }

      if (isTestMode) {
        setBook({ ...TEST_BOOK_DETAIL, bookId: Number(bookId) });
        setTestReviewList(TEST_REVIEWS);
        setErrorMessage('');
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
  }, [bookId, isTestMode]);

  useEffect(() => {
    if (!isTestMode) return;

    localStorage.setItem('abcBookTestMyReviews', JSON.stringify(testReviewList.filter((review) => review.isMine)));
  }, [isTestMode, testReviewList]);

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
      if (isTestMode) {
        return;
      }

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

    const currentMyReview = testReviews.find((review) => review.isMine);

    setReviewRating(currentMyReview?.rating ?? 0);
    setReviewContent(currentMyReview?.content ?? '');
    setReviewNotice('');
    setIsReviewModalOpen(true);
  }

  function handleSubmitReview() {
    if (!isTestMode) return;

    if (!reviewRating || !reviewContent.trim()) {
      setReviewNotice('별점과 리뷰 내용을 입력해 주세요.');
      return;
    }

    if (myReview) {
      setTestReviewList((reviews) =>
        reviews.map((review) =>
          review.reviewId === myReview.reviewId
            ? {
                ...review,
                rating: reviewRating,
                content: reviewContent,
                date: '2026.07.05',
                isEdited: true,
              }
            : review,
        ),
      );
      setReviewNotice('리뷰가 정상적으로 수정되었습니다.');
      setIsReviewModalOpen(false);
      return;
    }

    setTestReviewList((reviews) => [
      {
        reviewId: Date.now(),
        nickname: '문학소녀',
        role: '사용자',
        rating: reviewRating,
        content: reviewContent,
        date: '2026.07.05',
        isMine: true,
      },
      ...reviews,
    ]);
    setReviewNotice('리뷰가 정상적으로 등록되었습니다.');
    setIsReviewModalOpen(false);
  }

  function handleStartEditReview(review: TestReview) {
    setEditingReviewId(review.reviewId);
    setEditReviewContent(review.content);
    setActiveReviewMenuId(null);
  }

  function handleCompleteEditReview(reviewId: number) {
    if (!editReviewContent.trim()) return;

    setTestReviewList((reviews) =>
      reviews.map((review) =>
        review.reviewId === reviewId
          ? {
              ...review,
              content: editReviewContent,
              date: '2026.07.05',
              isEdited: true,
            }
          : review,
      ),
    );
    setEditingReviewId(null);
    setEditReviewContent('');
  }

  function handleDeleteReview() {
    if (!deleteReviewId) return;

    setTestReviewList((reviews) => reviews.filter((review) => review.reviewId !== deleteReviewId));
    setDeleteReviewId(null);
    setActiveModal(null);
    setIsReviewModalOpen(false);
    setReviewRating(0);
    setReviewContent('');
  }

  function handleSubmitReport(type: 'BOOK' | 'REVIEW') {
    if (!reportReason || !reportContent.trim()) {
      setReportNotice('신고 사유와 신고 내용을 입력해 주세요.');
      return;
    }

    if (isTestMode) {
      const savedReports = localStorage.getItem('abcBookTestMyReports');
      const reports = savedReports ? (JSON.parse(savedReports) as TestReport[]) : [];
      const nextReport: TestReport = {
        reportId: Date.now(),
        type,
        targetId: type === 'BOOK' ? Number(bookId) : reportTargetReviewId ?? 0,
        reason: reportReason,
        content: reportContent,
        createdAt: '2026.07.05',
      };

      localStorage.setItem('abcBookTestMyReports', JSON.stringify([nextReport, ...reports]));
    }

    setReportNotice('신고가 정상적으로 접수되었습니다.');
  }

  function closeReportModal() {
    setActiveModal(null);
    setReportReason('');
    setReportContent('');
    setReportNotice('');
    setReportTargetReviewId(null);
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
      <p className="eyebrow">U-008</p>
      {isTestMode && <p className={styles.testNotice}>테스트 모드: 로그인 회원 상태와 임시 추천/리뷰 데이터로 동작을 확인합니다.</p>}

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
              <dd>-</dd>
            </div>
            <div>
              <dt>장르</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>페이지 수</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>유료 / 무료</dt>
              <dd className={styles.inlineValue}>
                {book ? <span className={styles.chip}>{book.rentalType === 'FREE' ? '무료' : '유료'}</span> : '-'}
              </dd>
            </div>
            <div>
              <dt>대여 가능일</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>반납 예정일</dt>
              <dd>-</dd>
            </div>
          </dl>

          <div className={styles.intro}>
            <strong>책 소개</strong>
            <p>{book?.description ?? '도서 상세 정보를 불러오면 책 소개가 표시됩니다.'}</p>
          </div>

          <div className={styles.tags} aria-label="키워드">
            <span>키워드 없음</span>
          </div>
        </div>

        <aside className={styles.actionPanel} aria-label="도서 활동">
          <button className="button button-primary" type="button" onClick={handleRentClick}>
            대여하기
          </button>
          <button className="button button-secondary" type="button" onClick={handleRentClick}>
            소장하기
          </button>

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
            <dd>-</dd>
          </div>
          <div>
            <dt>출판사</dt>
            <dd>{book?.publisher ?? '-'}</dd>
          </div>
          <div>
            <dt>발행일</dt>
            <dd>-</dd>
          </div>
          <div>
            <dt>파일 형식</dt>
            <dd>-</dd>
          </div>
          <div>
            <dt>지원 기기</dt>
            <dd>-</dd>
          </div>
          <div>
            <dt>언어</dt>
            <dd>-</dd>
          </div>
          <div>
            <dt>카테고리</dt>
            <dd>-</dd>
          </div>
          <div>
            <dt>키워드</dt>
            <dd>-</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} id="book-recommendations">
        <div className={styles.rowTitle}>
          <h2>같은 작가의 다른 책</h2>
          <Link to={`/books/${bookId}/recommendations`}>더보기</Link>
        </div>
        {authorRecommendations.length > 0 ? (
          <div className={styles.bookGrid}>
            {authorRecommendations.map((recommendation) => (
              <Link
                className={styles.bookCard}
                key={recommendation.bookId}
                to={`/books/${recommendation.bookId}${isTestMode ? '?testMode=1' : ''}`}
              >
                <span className={styles.bookThumb}>표지</span>
                <strong>{recommendation.title}</strong>
                <span>{recommendation.author}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>추천 도서 API 연결 후 표시됩니다.</p>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.rowTitle}>
          <h2>같은 장르의 다른 책</h2>
          <Link to={`/books/${bookId}/recommendations`}>더보기</Link>
        </div>
        {genreRecommendations.length > 0 ? (
          <div className={styles.bookGrid}>
            {genreRecommendations.map((recommendation) => (
              <Link
                className={styles.bookCard}
                key={recommendation.bookId}
                to={`/books/${recommendation.bookId}${isTestMode ? '?testMode=1' : ''}`}
              >
                <span className={styles.bookThumb}>표지</span>
                <strong>{recommendation.title}</strong>
                <span>{recommendation.author}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>추천 도서 API 연결 후 표시됩니다.</p>
        )}
      </section>

      <section className={styles.section} id="book-reviews">
        <div className={styles.reviewHeader}>
          <h2>리뷰</h2>
          <button className="button button-secondary" type="button" onClick={openReviewEditor}>
            나의 리뷰 작성
          </button>
        </div>

        <div className={styles.reviewSummary}>
          <p className={styles.emptyState}>리뷰 목록 API 연결 후 평점 요약이 표시됩니다.</p>
        </div>

        <div className={styles.reviewList}>
          <h3>이 책을 읽은 독자들의 한 줄 소감평</h3>
          {testReviews.length > 0 ? (
            <div className={styles.reviewRows}>
              {testReviews.map((review) => (
                <article className={styles.reviewRow} key={review.reviewId}>
                  <div className={styles.reviewProfile} aria-hidden="true" />
                  <div className={styles.reviewBody}>
                    <strong>
                      {review.nickname}
                      {review.isMine ? ` (${review.role})` : ''}
                    </strong>
                    {editingReviewId === review.reviewId ? (
                      <input
                        className={styles.reviewEditInput}
                        value={editReviewContent}
                        onChange={(event) => setEditReviewContent(event.target.value)}
                        aria-label="수정할 리뷰 내용"
                      />
                    ) : (
                      <p>{review.content}</p>
                    )}
                    <StarRating rating={review.rating} />
                  </div>
                  <span className={styles.reviewDate}>
                    {review.date}
                    {review.isEdited ? ' (수정됨)' : ''}
                  </span>
                  {editingReviewId === review.reviewId ? (
                    <button className="button button-secondary" type="button" onClick={() => handleCompleteEditReview(review.reviewId)}>
                      수정 완료
                    </button>
                  ) : (
                    <div className={styles.reviewMenu}>
                      <button
                        type="button"
                        onClick={() => setActiveReviewMenuId(activeReviewMenuId === review.reviewId ? null : review.reviewId)}
                        aria-label="리뷰 메뉴 열기"
                      >
                        ⋮
                      </button>
                      {activeReviewMenuId === review.reviewId && (
                        <div className={styles.reviewMenuPanel}>
                          {review.isMine ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEditReview(review)}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteReviewId(review.reviewId);
                                  setActiveModal('deleteReview');
                                  setActiveReviewMenuId(null);
                                }}
                              >
                                삭제
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReportTargetReviewId(review.reviewId);
                                setReportReason('');
                                setReportContent('');
                                setReportNotice('');
                                setActiveModal('reviewReport');
                                setActiveReviewMenuId(null);
                              }}
                            >
                              신고
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>등록된 리뷰가 없습니다.</p>
          )}
        </div>
      </section>

      {isReviewModalOpen && (
        <ModalShell title="나의 리뷰 작성" onClose={() => setIsReviewModalOpen(false)}>
          <p className={styles.modalMessage}>{myReview ? '내가 작성한 리뷰' : '이 책은 어떠셨나요?'}</p>
          <StarPicker value={reviewRating} onChange={setReviewRating} />

          <label>
            리뷰 내용
            <textarea
              value={reviewContent}
              onChange={(event) => setReviewContent(event.target.value)}
              placeholder="이 책에 대한 감상을 남겨주세요. 다른 독자들에게 큰 도움이 됩니다."
            />
          </label>
          {reviewNotice && <p className={styles.modalMessage}>{reviewNotice}</p>}

          <div className={styles.modalActions}>
            <button className="button button-primary" type="button" onClick={handleSubmitReview}>
              {myReview ? '리뷰 수정' : '리뷰 등록'}
            </button>
            {myReview && (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setDeleteReviewId(myReview.reviewId);
                  setIsReviewModalOpen(false);
                  setActiveModal('deleteReview');
                }}
              >
                리뷰 삭제
              </button>
            )}
          </div>
        </ModalShell>
      )}

      {activeModal === 'login' && (
        <ModalShell title="회원 전용 기능입니다" onClose={() => setActiveModal(null)}>
          <p className={styles.modalMessage}>로그인/회원가입 후 이용할 수 있습니다.</p>
          <div className={styles.modalActions}>
            <Link className="button button-primary" to="/login">
              예
            </Link>
            <button className="button button-secondary" type="button" onClick={() => setActiveModal(null)}>
              아니오
            </button>
          </div>
        </ModalShell>
      )}

      {activeModal === 'bookReport' && (
        <ModalShell title="책 신고하기" onClose={closeReportModal}>
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
          {reportNotice && <p className={styles.modalMessage}>{reportNotice}</p>}

          <div className={styles.modalActions}>
            {reportNotice ? (
              <button className="button button-secondary" type="button" onClick={closeReportModal}>
                닫기
              </button>
            ) : (
              <button className="button button-primary" type="button" onClick={() => handleSubmitReport('BOOK')}>
                신고 등록
              </button>
            )}
          </div>
        </ModalShell>
      )}

      {activeModal === 'reviewReport' && (
        <ModalShell title="리뷰 신고하기" onClose={closeReportModal}>
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
          {reportNotice && <p className={styles.modalMessage}>{reportNotice}</p>}

          <div className={styles.modalActions}>
            {reportNotice ? (
              <button className="button button-secondary" type="button" onClick={closeReportModal}>
                닫기
              </button>
            ) : (
              <button className="button button-primary" type="button" onClick={() => handleSubmitReport('REVIEW')}>
                신고 등록
              </button>
            )}
          </div>
        </ModalShell>
      )}

      {activeModal === 'deleteReview' && (
        <ModalShell title="리뷰 삭제" onClose={() => setActiveModal(null)}>
          <p className={styles.modalMessage}>정말 이 리뷰를 삭제하시겠습니까?</p>
          <div className={styles.modalActions}>
            <button className="button button-primary" type="button" onClick={handleDeleteReview}>
              예
            </button>
            <button className="button button-secondary" type="button" onClick={() => setActiveModal(null)}>
              아니오
            </button>
          </div>
        </ModalShell>
      )}
    </section>
  );
}
