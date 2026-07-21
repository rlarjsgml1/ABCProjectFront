// 사이트 공통 헤더 — 로고, 도서 검색, 주요 내비게이션, 로그인/알림 상태를 표시
import axios from 'axios';
import { ChangeEvent, CompositionEvent, FocusEvent, FormEvent, KeyboardEvent, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_CHANGED_EVENT } from '../../api/authApi';
import { searchBooks } from '../../api/bookApi';
import { NOTIFICATIONS_UPDATED_EVENT, getMyNotifications } from '../../api/notificationsApi';
import type { BookCard } from '../../types/api';
import abcLogo from '../../assets/abc-logo.png';
import { addRecentSearch, clearRecentSearches, getRecentSearches, removeRecentSearch } from '../../utils/recentSearches';

const authStorageKeys = ['accessToken', 'memberRole', 'memberId', 'loginId', 'memberName'];

function hasLoginSession() {
    return Boolean(localStorage.getItem('accessToken'));
}

const navItems = [
    { to: '/', label: 'HOME' },
    { to: '/books', label: '도서' },
    { to: '/books?section=best', label: '베스트' },
    //{ to: '/books?category=web-novel', label: '웹소설' },
    //{ to: '/books?category=comic', label: '만화' },
    //{ to: '/books?type=ebook', label: 'e북' },
    { to: '/notices', label: '공지사항' },
];

const SUGGESTION_MIN_LENGTH = 2;
const SUGGESTION_DEBOUNCE_MS = 300;

type SuggestionStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [keyword, setKeyword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [suggestions, setSuggestions] = useState<BookCard[]>([]);
    const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>('idle');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const timerRef = useRef<number>();
    const abortRef = useRef<AbortController | null>(null);
    const generationRef = useRef(0);

    useEffect(() => {
        setIsLoggedIn(hasLoginSession());
    }, [location.pathname, location.search]);

    useEffect(() => {
        // 로그인/로그아웃으로 계정이 바뀌면 그 계정에 맞는 검색 기록으로 다시 불러온다.
        setRecentSearches(getRecentSearches());
    }, [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn) {
            setUnreadNotificationCount(0);
            return;
        }

        let ignore = false;

        const loadUnreadCount = async () => {
            try {
                const data = await getMyNotifications({ readYn: false, page: 0, size: 1 });
                if (!ignore) {
                    setUnreadNotificationCount(data.totalElements);
                }
            } catch {
                // API-NOTI-001이 아직 없는 동안에는 배지를 표시하지 않는다.
            }
        };

        void loadUnreadCount();
        window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, loadUnreadCount);

        return () => {
            ignore = true;
            window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, loadUnreadCount);
        };
    }, [isLoggedIn]);

    useEffect(() => {
        const syncAuthState = () => {
            setIsLoggedIn(hasLoginSession());
        };

        window.addEventListener('storage', syncAuthState);
        window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);

        return () => {
            window.removeEventListener('storage', syncAuthState);
            window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
        };
    }, []);

    useEffect(() => {
        return () => {
            // unmount 시점의 최신 ref 값을 무효화해야 하므로 effect 밖으로 값을 복사하지 않는다.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            ++generationRef.current;
            window.clearTimeout(timerRef.current);
            abortRef.current?.abort();
        };
    }, []);

    const cancelPendingSearch = useCallback(() => {
        ++generationRef.current;
        window.clearTimeout(timerRef.current);
        abortRef.current?.abort();
        abortRef.current = null;
        setSuggestions([]);
        setSuggestionStatus('idle');
    }, []);

    const scheduleSearch = useCallback((value: string) => {
        const trimmed = value.trim();
        const generation = ++generationRef.current;
        window.clearTimeout(timerRef.current);
        abortRef.current?.abort();

        setSuggestions([]);
        setSuggestionStatus('idle');

        if (trimmed.length < SUGGESTION_MIN_LENGTH) return;

        timerRef.current = window.setTimeout(async () => {
            if (generation !== generationRef.current) return;

            const controller = new AbortController();
            abortRef.current = controller;
            setSuggestionStatus('loading');

            try {
                const page = await searchBooks(0, 5, { q: trimmed }, controller.signal);
                if (generation !== generationRef.current) return;
                setSuggestions(page.content);
                setSuggestionStatus(page.content.length ? 'success' : 'empty');
            } catch (error) {
                if (generation !== generationRef.current) return;
                if (axios.isCancel(error)) return;
                setSuggestionStatus('error');
            }
        }, SUGGESTION_DEBOUNCE_MS);
    }, []);

    const isActiveNav = (to: string) => {
        const searchParams = new URLSearchParams(location.search);
        const isHomeMorePage = location.pathname === '/books' && searchParams.get('source') === 'home';

        if (to === '/') return location.pathname === '/' || isHomeMorePage;
        if (to === '/books') return !isHomeMorePage && ((location.pathname === '/books' && searchParams.get('section') !== 'best') || location.pathname === '/search');
        return `${location.pathname}${location.search}` === to;
    };

    const runSearch = (query: string) => {
        cancelPendingSearch();
        setIsSearchFocused(false);
        if (!query) return;
        setRecentSearches(addRecentSearch(query));
        navigate(`/search?q=${encodeURIComponent(query)}`);
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        runSearch(keyword.trim());
    };

    const handleRecentSearchSelect = (query: string) => {
        setKeyword(query);
        runSearch(query);
    };

    const handleRecentSearchRemove = (event: MouseEvent<HTMLButtonElement>, query: string) => {
        event.preventDefault();
        event.stopPropagation();
        setRecentSearches(removeRecentSearch(query));
    };

    const handleRecentSearchClear = () => {
        setRecentSearches(clearRecentSearches());
    };

    const handleSuggestionSelect = () => {
        cancelPendingSearch();
        setIsSearchFocused(false);
    };

    const handleNoResultClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const query = keyword.trim();
        if (!query) return;
        navigate(`/search?q=${encodeURIComponent(query)}&request=1`);
        cancelPendingSearch();
        setIsSearchFocused(false);
    };

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setKeyword(value);
        setIsSearchFocused(true);
        // 조합 중이어도 예약한다: compositionend가 늦게(또는 안) 오는 경우에도 debounce로 검색이 실행되게 한다.
        scheduleSearch(value);
    };

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
        if (keyword.trim().length >= SUGGESTION_MIN_LENGTH && suggestionStatus === 'idle') {
            scheduleSearch(keyword);
        }
    };

    const handleSearchCompositionStart = () => {
        window.clearTimeout(timerRef.current);
        abortRef.current?.abort();
    };

    const handleSearchCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
        scheduleSearch(event.currentTarget.value);
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        // Safari 등에서 한글 조합 확정 Enter가 그대로 폼 제출로 이어지는 것을 막는다.
        if (event.key === 'Enter' && event.nativeEvent.isComposing) {
            event.preventDefault();
        }
    };

    const handleSearchFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
        // input이 아니라 결과 Link에 focus가 있어도 Escape가 동작하도록 form 레벨에서 처리한다.
        if (event.key === 'Escape') {
            cancelPendingSearch();
            setIsSearchFocused(false);
        }
    };

    const handleSearchBlur = (event: FocusEvent<HTMLFormElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            cancelPendingSearch();
            setIsSearchFocused(false);
        }
    };

    const handleLogout = () => {
        authStorageKeys.forEach((key) => localStorage.removeItem(key));
        setIsLoggedIn(hasLoginSession());
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
        navigate('/');
    };

    return (
        <header className="abc-header">
            <div className="abc-header-inner">
            <div className="abc-header-top">
                <Link className="abc-logo" to="/">
                    <img src={abcLogo} alt="ABC" />
                </Link>

                <nav className="abc-nav" aria-label="주요 메뉴">
                    {navItems.map((item) => (
                        <Link key={item.label} className={`abc-nav-link ${isActiveNav(item.to) ? 'active' : ''}`} to={item.to}>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <form className="abc-search" onSubmit={handleSearch} onBlur={handleSearchBlur} onKeyDown={handleSearchFormKeyDown}>
                    <button className="abc-search-button" type="submit" aria-label="검색">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                        </svg>
                    </button>
                    <input
                        className="abc-search-input"
                        value={keyword}
                        onChange={handleSearchChange}
                        onCompositionStart={handleSearchCompositionStart}
                        onCompositionEnd={handleSearchCompositionEnd}
                        onKeyDown={handleSearchKeyDown}
                        onClick={() => setIsSearchFocused(true)}
                        onFocus={handleSearchFocus}
                        aria-label="도서 검색"
                    />
                    {isSearchFocused && keyword.trim().length === 0 ? (
                        <div className="abc-search-suggestions">
                            <div className="abc-search-recent-header">
                                <span>최근 검색어</span>
                                {recentSearches.length > 0 ? (
                                    <button type="button" onClick={handleRecentSearchClear}>
                                        전체 삭제
                                    </button>
                                ) : null}
                            </div>
                            {recentSearches.length > 0 ? (
                                <ul className="abc-search-recent-list">
                                    {recentSearches.map((query) => (
                                        <li key={query}>
                                            <button type="button" onClick={() => handleRecentSearchSelect(query)}>
                                                {query}
                                            </button>
                                            <button
                                                type="button"
                                                className="abc-search-recent-remove"
                                                aria-label={`${query} 최근 검색어 삭제`}
                                                onClick={(event) => handleRecentSearchRemove(event, query)}
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="abc-search-status">최근 검색어가 없습니다</div>
                            )}
                        </div>
                    ) : null}

                    {isSearchFocused && keyword.trim().length >= SUGGESTION_MIN_LENGTH && suggestionStatus !== 'idle' ? (
                        <div className="abc-search-suggestions">
                            {suggestionStatus === 'loading' ? (
                                <div className="abc-search-status" role="status" aria-live="polite">
                                    검색 중
                                </div>
                            ) : null}

                            {suggestionStatus === 'success' ? (
                                <ul className="abc-search-result-list">
                                    {suggestions.map((book) => (
                                        <li key={book.bookId}>
                                            <Link to={`/books/${book.bookId}`} onClick={handleSuggestionSelect}>
                                                {book.coverImageUrl ? (
                                                    <img src={book.coverImageUrl} alt="" />
                                                ) : (
                                                    <span className="abc-search-result-cover-placeholder" />
                                                )}
                                                <span className="abc-search-result-text">
                                                    <strong>{book.title}</strong>
                                                    <small>{book.authors.join(', ') || book.publisherName}</small>
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}

                            {suggestionStatus === 'empty' ? (
                                <div className="abc-search-no-result" role="status" aria-live="polite">
                                    <span>검색 결과 없음</span>
                                    <button type="button" onClick={handleNoResultClick}>
                                        희망 도서 신청
                                    </button>
                                </div>
                            ) : null}

                            {suggestionStatus === 'error' ? (
                                <div className="abc-search-status" role="status" aria-live="polite">
                                    검색 결과를 불러오지 못했습니다
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </form>

                <div className="abc-actions">
                    {isLoggedIn ? (
                        <>
                            <button className="abc-dark-button" type="button" onClick={handleLogout}>로그아웃</button>
                        </>
                    ) : (
                        <>
                            <Link className="abc-outline-button" to="/login">
                                로그인
                            </Link>
                            <Link className="abc-dark-button" to="/signup">
                                회원가입
                            </Link>
                        </>
                    )}

                    {isLoggedIn ? (
                        <Link className="abc-notification-button" to="/me/notifications" aria-label={unreadNotificationCount > 0 ? `알림 (안읽음 ${unreadNotificationCount}건)` : '알림'}>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M6 16v-5a6 6 0 1 1 12 0v5l1.6 2.2H4.4L6 16Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                <path d="M10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {unreadNotificationCount > 0 ? (
                                <span className="abc-notification-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>
                            ) : null}
                        </Link>
                    ) : null}

                    <Link className="abc-profile-button" to={isLoggedIn ? '/me' : '/login'} aria-label="마이페이지">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="M5.5 19c.9-3.4 3.2-5.1 6.5-5.1s5.6 1.7 6.5 5.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                        </svg>
                    </Link>
                </div>
            </div>
            </div>
        </header>
    );
}
