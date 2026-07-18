import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NavItem } from 'epubjs';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addBookmark,
  deleteBookmark,
  getBookmarks,
  getViewerEpub,
  getViewerSession,
  saveReadingProgress,
  ViewerApiError,
} from '../../../api/viewerApi';
import { Modal } from '../../../components/common/Modal';
import {
  EpubRenderer,
  type EpubFlow,
  type EpubLoadingPhase,
  type EpubRendererHandle,
} from '../../../components/viewer/EpubRenderer';
import type { BookmarkItem, EpubLocator, ViewerSessionData } from '../../../types/api';

type LoadPhase = 'session' | 'download' | EpubLoadingPhase | 'error';
type SidePanel = 'toc' | 'bookmarks' | null;
type PendingProgress = { locator: EpubLocator; atEnd: boolean };

const FONT_SIZE_MIN = 70;
const FONT_SIZE_MAX = 200;
const FONT_SIZE_STEP = 10;

const loadingMessages: Record<Exclude<LoadPhase, 'ready' | 'error'>, string> = {
  session: '열람 권한과 저장 위치를 확인하고 있습니다.',
  download: 'EPUB 파일을 다운로드하고 있습니다.',
  parsing: 'EPUB 구조를 분석하고 있습니다.',
  locations: '이어보기 위치를 계산하고 있습니다.',
  rendering: '본문을 화면에 배치하고 있습니다.',
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '전자책을 불러오지 못했습니다.';
}

function toInitialLocator(session: ViewerSessionData | null): EpubLocator | null {
  if (!session?.progress?.cfi) return null;
  return {
    epubVersion: session.epubVersion,
    cfi: session.progress.cfi,
    chapterHref: session.progress.chapterHref,
    spineIndex: session.progress.spineIndex,
    progression: session.progress.progression,
  };
}

function formatProgression(progression: number) {
  return Math.round(Math.min(1, Math.max(0, progression)) * 100);
}

function normalizeHref(href: string | null | undefined) {
  return href?.split('#')[0] ?? '';
}

function toRequestLocator(locator: EpubLocator) {
  return {
    ...locator,
    spineIndex: locator.spineIndex ?? 0,
  };
}

function findTocLabel(items: NavItem[], href: string | null | undefined): string | null {
  const target = normalizeHref(href);
  for (const item of items) {
    if (normalizeHref(item.href) === target) return item.label;
    const nested = item.subitems ? findTocLabel(item.subitems, href) : null;
    if (nested) return nested;
  }
  return null;
}

function TocItems({ items, onSelect }: { items: NavItem[]; onSelect: (item: NavItem) => void }) {
  return (
    <ul className="viewer-toc-list">
      {items.map((item) => (
        <li key={`${item.id}-${item.href}`}>
          <button type="button" onClick={() => onSelect(item)}>
            {item.label}
          </button>
          {item.subitems?.length ? <TocItems items={item.subitems} onSelect={onSelect} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function ViewerPage() {
  const { rentalId: rentalIdParam } = useParams<{ rentalId: string }>();
  const rentalId = Number(rentalIdParam);
  const navigate = useNavigate();
  const rendererRef = useRef<EpubRendererHandle>(null);
  const revisionRef = useRef(0);
  const pendingProgressRef = useRef<PendingProgress | null>(null);
  const persistedLocationRef = useRef('');
  const saveTimerRef = useRef<number | null>(null);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);

  const [session, setSession] = useState<ViewerSessionData | null>(null);
  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [currentLocator, setCurrentLocator] = useState<EpubLocator | null>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [phase, setPhase] = useState<LoadPhase>('session');
  const [errorMessage, setErrorMessage] = useState('');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [confirmDeleteBookmarkId, setConfirmDeleteBookmarkId] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontSizePercent, setFontSizePercent] = useState(100);
  const [flow, setFlow] = useState<EpubFlow>('PAGE');
  const [scrubPercent, setScrubPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const initialLocator = useMemo(() => toInitialLocator(session), [session]);
  const currentBookmark = bookmarks.find(
    (bookmark) => bookmark.epubVersion === currentLocator?.epubVersion && bookmark.cfi === currentLocator?.cfi,
  );
  const currentChapter = findTocLabel(toc, currentLocator?.chapterHref);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function loadViewer() {
      if (!Number.isInteger(rentalId) || rentalId <= 0) {
        setPhase('error');
        setErrorMessage('유효하지 않은 대여 번호입니다.');
        return;
      }

      setPhase('session');
      setErrorMessage('');
      setSaveErrorMessage('');
      setEpubData(null);
      setSession(null);
      setToc([]);
      setSidePanel(null);

      try {
        const nextSession = await getViewerSession(rentalId, controller.signal);
        if (ignore) return;
        if (!nextSession.contentReady) {
          throw new ViewerApiError('이 도서에는 아직 EPUB 파일이 등록되지 않았습니다.', 404, 'BOOK_EPUB_NOT_FOUND');
        }

        setSession(nextSession);
        revisionRef.current = nextSession.progress?.revision ?? 0;
        const savedLocator = toInitialLocator(nextSession);
        setCurrentLocator(savedLocator);
        setScrubPercent(savedLocator ? formatProgression(savedLocator.progression) : 0);
        setIsCompleted(nextSession.progress?.completedYn ?? false);
        persistedLocationRef.current = savedLocator ? `${savedLocator.cfi}:false` : '';

        setPhase('download');
        const binary = await getViewerEpub(rentalId, controller.signal);
        if (ignore) return;
        setEpubData(binary);

        try {
          const items = await getBookmarks(rentalId);
          if (!ignore) setBookmarks([...items].sort((a, b) => a.progression - b.progression));
        } catch (error) {
          if (!ignore) setSaveErrorMessage(`북마크를 불러오지 못했습니다. ${getErrorMessage(error)}`);
        }
      } catch (error) {
        if (!ignore) {
          setPhase('error');
          setErrorMessage(getErrorMessage(error));
        }
      }
    }

    void loadViewer();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [rentalId, reloadKey]);

  const persistProgress = useCallback(
    async (pending: PendingProgress) => {
      const send = () =>
        saveReadingProgress(rentalId, {
          ...toRequestLocator(pending.locator),
          atEnd: pending.atEnd,
          expectedRevision: revisionRef.current,
        });

      try {
        let result;
        try {
          result = await send();
        } catch (error) {
          if (!(error instanceof ViewerApiError) || error.status !== 409) throw error;
          const latestSession = await getViewerSession(rentalId);
          if (latestSession.epubVersion !== pending.locator.epubVersion) {
            throw new ViewerApiError('EPUB 파일이 교체되었습니다. 뷰어를 새로고침해 주세요.', 409);
          }
          revisionRef.current = latestSession.progress?.revision ?? 0;
          result = await send();
        }

        revisionRef.current = result.revision;
        persistedLocationRef.current = `${pending.locator.cfi}:${pending.atEnd}`;
        if (mountedRef.current) {
          setIsCompleted(result.completedYn);
          setSaveErrorMessage('');
        }
      } catch (error) {
        if (mountedRef.current) setSaveErrorMessage(`읽던 위치를 저장하지 못했습니다. ${getErrorMessage(error)}`);
      }
    },
    [rentalId],
  );

  const flushProgress = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const pending = pendingProgressRef.current;
    if (!pending) return saveChainRef.current;
    const locationKey = `${pending.locator.cfi}:${pending.atEnd}`;
    if (locationKey === persistedLocationRef.current) {
      pendingProgressRef.current = null;
      return saveChainRef.current;
    }

    pendingProgressRef.current = null;
    saveChainRef.current = saveChainRef.current.catch(() => undefined).then(() => persistProgress(pending));
    return saveChainRef.current;
  }, [persistProgress]);

  const handleLocationChange = useCallback(
    (locator: EpubLocator, atStart: boolean, atEnd: boolean) => {
      setCurrentLocator(locator);
      setIsAtStart(atStart);
      setIsAtEnd(atEnd);
      setScrubPercent(formatProgression(locator.progression));
      pendingProgressRef.current = { locator, atEnd };
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => void flushProgress(), 1500);
    },
    [flushProgress],
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void flushProgress();
    };
    const handlePageHide = () => void flushProgress();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      void flushProgress();
    };
  }, [flushProgress]);

  useEffect(() => {
    if (phase !== 'ready') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target?.tagName ?? '')) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        void rendererRef.current?.prev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        void rendererRef.current?.next();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  async function handleBookmarkToggle() {
    if (!currentLocator) return;
    if (currentBookmark) {
      setConfirmDeleteBookmarkId(currentBookmark.bookmarkId);
      return;
    }

    try {
      const created = await addBookmark(rentalId, {
        ...toRequestLocator(currentLocator),
      });
      setBookmarks((current) => [...current, created].sort((a, b) => a.progression - b.progression));
      setSaveErrorMessage('');
    } catch (error) {
      setSaveErrorMessage(getErrorMessage(error));
    }
  }

  async function handleConfirmDeleteBookmark(bookmarkId: number) {
    try {
      await deleteBookmark(rentalId, bookmarkId);
      setBookmarks((current) => current.filter((bookmark) => bookmark.bookmarkId !== bookmarkId));
      setSaveErrorMessage('');
    } catch (error) {
      setSaveErrorMessage(getErrorMessage(error));
    } finally {
      setConfirmDeleteBookmarkId(null);
    }
  }

  function handleTocSelect(item: NavItem) {
    void rendererRef.current?.display(item.href);
    setSidePanel(null);
  }

  function handleScrubCommit() {
    void rendererRef.current?.displayProgression(scrubPercent / 100);
  }

  const isReady = phase === 'ready';
  const progressPercent = currentLocator ? formatProgression(currentLocator.progression) : scrubPercent;

  return (
    <section className="viewer-page">
      <header className="viewer-topbar">
        <button type="button" className="viewer-icon-button" onClick={() => navigate('/me/rentals')}>
          나가기
        </button>

        <div className="viewer-title-block">
          <p className="viewer-title">{session?.title ?? '전자책 뷰어'}</p>
          <p className="viewer-page-label">
            {currentChapter ? `${currentChapter} · ` : ''}{progressPercent}%
            {isCompleted ? <span className="viewer-completed-badge">완독</span> : null}
          </p>
        </div>

        <div className="viewer-tool-buttons">
          <button type="button" className="viewer-icon-button" disabled={!isReady} onClick={() => void rendererRef.current?.first()}>
            처음
          </button>
          <button type="button" className="viewer-icon-button" disabled={!isReady || toc.length === 0} onClick={() => setSidePanel(sidePanel === 'toc' ? null : 'toc')}>
            목차
          </button>
          <button type="button" className="viewer-icon-button" disabled={!isReady} onClick={() => setIsSettingsOpen(true)}>
            보기 설정
          </button>
          <button type="button" className="viewer-icon-button" disabled={!isReady || !currentLocator} onClick={() => void handleBookmarkToggle()}>
            {currentBookmark ? '북마크됨' : '북마크'}
          </button>
          <button type="button" className="viewer-icon-button" onClick={() => setSidePanel(sidePanel === 'bookmarks' ? null : 'bookmarks')}>
            북마크 목록
          </button>
        </div>
      </header>

      {saveErrorMessage ? <div className="status-banner status-banner-error viewer-save-error">{saveErrorMessage}</div> : null}

      <div className="viewer-body">
        <main className="viewer-content">
          {epubData && session && !errorMessage ? (
            <EpubRenderer
              ref={rendererRef}
              data={epubData}
              epubVersion={session.epubVersion}
              initialLocator={initialLocator}
              fontSizePercent={fontSizePercent}
              flow={flow}
              onError={(error) => {
                setErrorMessage(error.message);
                setPhase('error');
              }}
              onLocationChange={handleLocationChange}
              onPhaseChange={setPhase}
              onTocChange={setToc}
            />
          ) : null}

          {phase !== 'ready' && phase !== 'error' ? (
            <div className="viewer-loading-state" role="status">
              <span className="viewer-loading-spinner" aria-hidden="true" />
              <strong>{loadingMessages[phase]}</strong>
            </div>
          ) : null}

          {phase === 'error' ? (
            <div className="viewer-error-state" role="alert">
              <strong>전자책을 열 수 없습니다.</strong>
              <p>{errorMessage}</p>
              <div className="form-action-row">
                <button type="button" className="button button-primary" onClick={() => setReloadKey((value) => value + 1)}>
                  다시 시도
                </button>
                <button type="button" className="button button-secondary" onClick={() => navigate('/me/rentals')}>
                  대여 목록
                </button>
              </div>
            </div>
          ) : null}
        </main>

        {sidePanel === 'toc' ? (
          <aside className="viewer-bookmark-panel" aria-label="목차">
            <div className="viewer-panel-heading">
              <h3>목차</h3>
              <button type="button" onClick={() => setSidePanel(null)} aria-label="목차 닫기">×</button>
            </div>
            {toc.length ? <TocItems items={toc} onSelect={handleTocSelect} /> : <p className="viewer-bookmark-empty">목차가 없습니다.</p>}
          </aside>
        ) : null}

        {sidePanel === 'bookmarks' ? (
          <aside className="viewer-bookmark-panel" aria-label="북마크 목록">
            <div className="viewer-panel-heading">
              <h3>북마크</h3>
              <button type="button" onClick={() => setSidePanel(null)} aria-label="북마크 목록 닫기">×</button>
            </div>
            {bookmarks.length === 0 ? <p className="viewer-bookmark-empty">저장된 북마크가 없습니다.</p> : null}
            <ul>
              {bookmarks.map((bookmark) => (
                <li key={bookmark.bookmarkId} className="viewer-bookmark-item">
                  {confirmDeleteBookmarkId === bookmark.bookmarkId ? (
                    <div className="viewer-bookmark-confirm">
                      <span>이 북마크를 삭제할까요?</span>
                      <div className="viewer-bookmark-confirm-actions">
                        <button type="button" className="button button-danger" onClick={() => void handleConfirmDeleteBookmark(bookmark.bookmarkId)}>삭제</button>
                        <button type="button" className="button button-secondary" onClick={() => setConfirmDeleteBookmarkId(null)}>취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button type="button" className="viewer-bookmark-page-button" onClick={() => {
                        void rendererRef.current?.display(bookmark.cfi);
                        setSidePanel(null);
                      }}>
                        {findTocLabel(toc, bookmark.chapterHref) || `${formatProgression(bookmark.progression)}% 위치`}
                      </button>
                      <button type="button" className="viewer-bookmark-delete-button" aria-label="북마크 삭제" onClick={() => setConfirmDeleteBookmarkId(bookmark.bookmarkId)}>×</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>

      <div className="viewer-progress-row">
        <span>{progressPercent}%</span>
        <input
          type="range"
          className="viewer-scrub-slider"
          aria-label="독서 진행률"
          min={0}
          max={100}
          value={scrubPercent}
          disabled={!isReady}
          onChange={(event) => setScrubPercent(Number(event.target.value))}
          onPointerUp={handleScrubCommit}
          onKeyUp={handleScrubCommit}
          onBlur={handleScrubCommit}
        />
      </div>

      <button type="button" className="viewer-edge-nav viewer-edge-nav-prev" aria-label="이전 화면" disabled={!isReady || isAtStart} onClick={() => void rendererRef.current?.prev()}>‹</button>
      <button type="button" className="viewer-edge-nav viewer-edge-nav-next" aria-label="다음 화면" disabled={!isReady || isAtEnd} onClick={() => void rendererRef.current?.next()}>›</button>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="보기 설정" titleId="viewer-settings-title" className="viewer-settings-modal" closeLabel="설정 닫기">
        <div className="viewer-settings-body">
          <div className="viewer-settings-group">
            <p className="viewer-settings-group-title">글자 크기</p>
            <div className="viewer-settings-row">
              <span>본문 배율</span>
              <div className="viewer-stepper">
                <button type="button" disabled={fontSizePercent <= FONT_SIZE_MIN} onClick={() => setFontSizePercent((value) => Math.max(FONT_SIZE_MIN, value - FONT_SIZE_STEP))}>-</button>
                <span>{fontSizePercent}%</span>
                <button type="button" disabled={fontSizePercent >= FONT_SIZE_MAX} onClick={() => setFontSizePercent((value) => Math.min(FONT_SIZE_MAX, value + FONT_SIZE_STEP))}>+</button>
              </div>
            </div>
          </div>

          <div className="viewer-settings-group">
            <p className="viewer-settings-group-title">읽기 방식</p>
            <div className="viewer-settings-row">
              <span>화면 흐름</span>
              <button type="button" className="viewer-mode-toggle" onClick={() => setFlow((current) => current === 'PAGE' ? 'SCROLL' : 'PAGE')}>
                {flow === 'PAGE' ? '페이지 넘김' : '세로 스크롤'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}
