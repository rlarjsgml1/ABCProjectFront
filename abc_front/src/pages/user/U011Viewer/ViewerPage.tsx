import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { addBookmark, deleteBookmark, getBookmarks, getViewerPage, saveReadingProgress } from '../../../api/viewerApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Modal } from '../../../components/common/Modal';
import type { BookmarkItem, ViewerPageData } from '../../../types/api';

type ReadingMode = 'PAGE' | 'SCROLL';
type SettingsView = 'main' | 'search';

const FONT_SIZE_MIN = 70;
const FONT_SIZE_MAX = 200;
const FONT_SIZE_STEP = 10;
const AUTO_ADVANCE_MIN = 10;
const AUTO_ADVANCE_MAX = 120;
const AUTO_ADVANCE_STEP = 10;

export function ViewerPage() {
  const { rentalId: rentalIdParam } = useParams<{ rentalId: string }>();
  const rentalId = Number(rentalIdParam);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageData, setPageData] = useState<ViewerPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isBookmarkPanelOpen, setIsBookmarkPanelOpen] = useState(false);
  const [confirmDeleteBookmarkId, setConfirmDeleteBookmarkId] = useState<number | null>(null);

  const [autoAdvanceInterval, setAutoAdvanceInterval] = useState(60);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const currentPageRef = useRef(currentPage);
  const totalPagesRef = useRef<number | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [fontSizePercent, setFontSizePercent] = useState(100);
  const [readingMode, setReadingMode] = useState<ReadingMode>('PAGE');
  const [searchPageInput, setSearchPageInput] = useState('');

  currentPageRef.current = currentPage;
  totalPagesRef.current = pageData?.totalPages ?? null;

  const currentBookmark = bookmarks.find((bookmark) => bookmark.pageNo === currentPage);

  useEffect(() => {
    let ignore = false;

    async function loadBookmarks() {
      try {
        const data = await getBookmarks(rentalId);
        if (!ignore) {
          setBookmarks(data);
        }
      } catch {
        if (!ignore) {
          setBookmarks([]);
        }
      }
    }

    void loadBookmarks();

    return () => {
      ignore = true;
    };
  }, [rentalId]);

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      setIsLoading(true);
      setErrorMessage('');
      setSearchParams({ page: String(currentPage) }, { replace: true });

      try {
        const data = await getViewerPage(rentalId, currentPage);
        const progress = await saveReadingProgress(rentalId, { currentPage });

        if (!ignore) {
          setPageData(data);
          setIsCompleted(progress.completedYn);
        }
      } catch (error) {
        if (!ignore) {
          setPageData(null);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalId, currentPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage((current) => {
      if (page < 1 || page === current) {
        return current;
      }
      return page;
    });
  }, []);

  useEffect(() => {
    if (!isAutoAdvancing) {
      return;
    }

    const timer = window.setInterval(() => {
      const totalPages = totalPagesRef.current;
      const next = currentPageRef.current + 1;

      if (totalPages !== null && next > totalPages) {
        setIsAutoAdvancing(false);
        return;
      }

      goToPage(next);
    }, autoAdvanceInterval * 1000);

    return () => window.clearInterval(timer);
  }, [isAutoAdvancing, autoAdvanceInterval, goToPage]);

  function openSettings() {
    setSettingsView('main');
    setIsSettingsOpen(true);
  }

  function closeSettings() {
    setIsSettingsOpen(false);
    setSearchPageInput('');
  }

  function handleSearchPageSubmit() {
    const page = Number(searchPageInput);

    if (!Number.isInteger(page) || page < 1) {
      return;
    }

    if (pageData && page > pageData.totalPages) {
      return;
    }

    goToPage(page);
    closeSettings();
  }

  async function handleBookmarkToggle() {
    if (currentBookmark) {
      setConfirmDeleteBookmarkId(currentBookmark.bookmarkId);
      return;
    }

    try {
      const created = await addBookmark(rentalId, { pageNo: currentPage });
      setBookmarks((current) => [...current, created].sort((a, b) => a.pageNo - b.pageNo));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  }

  async function handleConfirmDeleteBookmark(bookmarkId: number) {
    try {
      await deleteBookmark(rentalId, bookmarkId);
      setBookmarks((current) => current.filter((bookmark) => bookmark.bookmarkId !== bookmarkId));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setConfirmDeleteBookmarkId(null);
    }
  }

  const totalPages = pageData?.totalPages ?? 0;
  const progressPercent = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  return (
    <>
      <section className="viewer-page">
        <div className="viewer-topbar">
          <button type="button" className="viewer-icon-button" onClick={() => navigate('/me/rentals')} aria-label="나가기">
            ← 나가기
          </button>

          <div className="viewer-title-block">
            <p className="viewer-title">{pageData?.title ?? '전자책 뷰어'}</p>
            <p className="viewer-page-label">
              {currentPage} / {totalPages || '-'} 페이지 ({progressPercent}%)
              {isCompleted ? <span className="viewer-completed-badge">완독</span> : null}
            </p>
          </div>

          <div className="viewer-tool-buttons">
            <button type="button" className="viewer-icon-button" onClick={() => goToPage(1)}>
              처음으로
            </button>
            <button type="button" className="viewer-icon-button" aria-label="설정" onClick={openSettings}>
              ⚙ 설정
            </button>
            <button type="button" className="viewer-icon-button" onClick={handleBookmarkToggle}>
              {currentBookmark ? '★ 북마크됨' : '☆ 북마크'}
            </button>
            <button type="button" className="viewer-icon-button" onClick={() => setIsBookmarkPanelOpen((open) => !open)}>
              북마크 목록
            </button>
          </div>
        </div>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

        <div className="viewer-body">
          <div className="viewer-content">
            {isLoading ? (
              <div className="status-banner">페이지를 불러오는 중입니다.</div>
            ) : (
              <p className="viewer-page-text" style={{ fontSize: `${fontSizePercent}%` }}>
                {pageData?.pageContent}
              </p>
            )}
          </div>

          {isBookmarkPanelOpen ? (
            <aside className="viewer-bookmark-panel">
              <h3>북마크 목록</h3>
              {bookmarks.length === 0 ? <p className="viewer-bookmark-empty">저장된 북마크가 없습니다.</p> : null}
              <ul>
                {bookmarks.map((bookmark) => (
                  <li key={bookmark.bookmarkId} className="viewer-bookmark-item">
                    {confirmDeleteBookmarkId === bookmark.bookmarkId ? (
                      <div className="viewer-bookmark-confirm">
                        <span>책갈피를 삭제하시겠습니까?</span>
                        <div className="viewer-bookmark-confirm-actions">
                          <button
                            type="button"
                            className="button button-danger"
                            onClick={() => void handleConfirmDeleteBookmark(bookmark.bookmarkId)}
                          >
                            삭제
                          </button>
                          <button type="button" className="button button-secondary" onClick={() => setConfirmDeleteBookmarkId(null)}>
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button type="button" className="viewer-bookmark-page-button" onClick={() => goToPage(bookmark.pageNo)}>
                          {bookmark.pageNo} 페이지
                        </button>
                        <button
                          type="button"
                          className="viewer-bookmark-delete-button"
                          aria-label={`${bookmark.pageNo}페이지 북마크 삭제`}
                          onClick={() => setConfirmDeleteBookmarkId(bookmark.bookmarkId)}
                        >
                          ×
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>

        <div className="viewer-page-indicator">
          {currentPage}/{totalPages || '-'}
        </div>

        <div className="viewer-scrub-bar">
          <input
            type="range"
            className="viewer-scrub-slider"
            aria-label="페이지 스크럽"
            min={1}
            max={totalPages || 1}
            value={currentPage}
            disabled={totalPages <= 1}
            onChange={(event) => goToPage(Number(event.target.value))}
          />
        </div>
      </section>

      <button
        type="button"
        className="viewer-edge-nav viewer-edge-nav-prev"
        aria-label="이전 페이지"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        «
      </button>
      <button
        type="button"
        className="viewer-edge-nav viewer-edge-nav-next"
        aria-label="다음 페이지"
        disabled={totalPages > 0 && currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        »
      </button>

      <Modal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        title={settingsView === 'main' ? '보기 설정' : '지정 페이지 조회 (검색)'}
        titleId="viewer-settings-title"
        className="viewer-settings-modal"
        closeLabel={settingsView === 'main' ? '설정 닫기' : '닫기'}
        headerExtra={
          settingsView === 'main' ? (
            <button
              type="button"
              className="viewer-icon-button"
              aria-label="지정 페이지 조회"
              onClick={() => setSettingsView('search')}
            >
              🔍
            </button>
          ) : null
        }
      >
        {settingsView === 'main' ? (
          <div className="viewer-settings-body">
            <div className="viewer-settings-group">
              <p className="viewer-settings-group-title">스타일 설정</p>
              <div className="viewer-settings-row">
                <span>글자 크기</span>
                <div className="viewer-stepper">
                  <button
                    type="button"
                    disabled={fontSizePercent <= FONT_SIZE_MIN}
                    onClick={() => setFontSizePercent((value) => Math.max(FONT_SIZE_MIN, value - FONT_SIZE_STEP))}
                  >
                    -
                  </button>
                  <span>{fontSizePercent}%</span>
                  <button
                    type="button"
                    disabled={fontSizePercent >= FONT_SIZE_MAX}
                    onClick={() => setFontSizePercent((value) => Math.min(FONT_SIZE_MAX, value + FONT_SIZE_STEP))}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="viewer-settings-group">
              <p className="viewer-settings-group-title">자동넘김 설정</p>
              <div className="viewer-settings-row">
                <span>자동 넘김 시간 (초)</span>
                <div className="viewer-stepper">
                  <button
                    type="button"
                    disabled={autoAdvanceInterval <= AUTO_ADVANCE_MIN}
                    onClick={() => setAutoAdvanceInterval((value) => Math.max(AUTO_ADVANCE_MIN, value - AUTO_ADVANCE_STEP))}
                  >
                    -
                  </button>
                  <span>{autoAdvanceInterval}초</span>
                  <button
                    type="button"
                    disabled={autoAdvanceInterval >= AUTO_ADVANCE_MAX}
                    onClick={() => setAutoAdvanceInterval((value) => Math.min(AUTO_ADVANCE_MAX, value + AUTO_ADVANCE_STEP))}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="viewer-settings-row">
                <span>자동 넘김</span>
                <button
                  type="button"
                  className={`button ${isAutoAdvancing ? 'button-secondary' : 'button-primary'}`}
                  onClick={() => setIsAutoAdvancing((current) => !current)}
                >
                  {isAutoAdvancing ? '중지' : '시작'}
                </button>
              </div>
            </div>

            <div className="viewer-settings-group">
              <p className="viewer-settings-group-title">읽기 설정</p>
              <div className="viewer-settings-row">
                <span>스크롤 모드</span>
                <button
                  type="button"
                  className="viewer-mode-toggle"
                  onClick={() => setReadingMode((mode) => (mode === 'PAGE' ? 'SCROLL' : 'PAGE'))}
                >
                  {readingMode === 'PAGE' ? '페이지 모드' : '스크롤 모드'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="viewer-search-field">
              <span aria-hidden="true">🔍</span>
              <input
                type="number"
                min={1}
                max={totalPages || undefined}
                placeholder="이동할 페이지 번호"
                value={searchPageInput}
                onChange={(event) => setSearchPageInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSearchPageSubmit();
                  }
                }}
              />
              {searchPageInput ? (
                <button type="button" aria-label="입력 지우기" onClick={() => setSearchPageInput('')}>
                  ×
                </button>
              ) : null}
            </div>

            <div className="form-action-row">
              <button type="button" className="button button-primary" onClick={handleSearchPageSubmit}>
                이동
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
