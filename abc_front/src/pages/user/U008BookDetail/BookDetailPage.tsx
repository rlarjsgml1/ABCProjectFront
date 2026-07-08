import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBookDetail } from '../../../api/bookApi';
import { createMyFavorite, deleteMyFavorite } from '../../../api/favoritesApi';
import type { BookDetail } from '../../../types/book';
import styles from '../../../styles/BookDetailPage.module.css';

type DetailTab = 'description' | 'recommendations' | 'reviews';
type ModalType = 'login' | 'bookReport' | 'reviewReport' | null;

const TEMP_PAYMENT_COMPLETE_PREVIEW = true;

function getPreviewBook(bookId: string): BookDetail {
  return {
    bookId: Number(bookId),
    title: `책 제목${bookId}`,
    author: `저자${bookId}`,
    publisher: 'ABC 출판',
    description: '대여와 결제 완료 흐름을 확인하기 위한 임시 도서 상세입니다.',
    coverImageUrl: '',
    rentalType: 'PAID',
    status: 'AVAILABLE',
  };
}

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
  const isSignedIn = TEMP_PAYMENT_COMPLETE_PREVIEW || Boolean(localStorage.getItem('accessToken'));
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
  const [reportReason, setReportReason] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportNotice, setReportNotice] = useState('');

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
        if (TEMP_PAYMENT_COMPLETE_PREVIEW) {
          setBook(getPreviewBook(bookId));
          setIsFavorite(false);
          setErrorMessage('');
          return;
        }
        setErrorMessage('도서 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadBookDetail();
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

    setReviewRating(0);
    setReviewContent('');
    setReviewNotice('');
    setIsReviewModalOpen(true);
  }

  function handleSubmitReview() {
    if (!reviewRating || !reviewContent.trim()) {
      setReviewNotice('별점과 리뷰 내용을 입력해 주세요.');
      return;
    }

    setReviewNotice('리뷰 등록 API 연결 후 처리됩니다.');
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
        <p className={styles.emptyState}>추천 도서 API 연결 후 표시됩니다.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.rowTitle}>
          <h2>같은 장르의 다른 책</h2>
          <Link to={`/books/${bookId}/recommendations`}>더보기</Link>
        </div>
        <p className={styles.emptyState}>추천 도서 API 연결 후 표시됩니다.</p>
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
          <p className={styles.emptyState}>등록된 리뷰가 없습니다.</p>
        </div>
      </section>

      {isReviewModalOpen && (
        <ModalShell title="나의 리뷰 작성" onClose={() => setIsReviewModalOpen(false)}>
          <p className={styles.modalMessage}>이 책은 어떠셨나요?</p>
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
              리뷰 등록
            </button>
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
              <button className="button button-primary" type="button" onClick={handleSubmitReport}>
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
              <button className="button button-primary" type="button" onClick={handleSubmitReport}>
                신고 등록
              </button>
            )}
          </div>
        </ModalShell>
      )}
    </section>
  );
}
