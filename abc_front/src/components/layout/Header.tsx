import { FormEvent, MouseEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_CHANGED_EVENT } from '../../api/authApi';
import abcLogo from '../../assets/abc-logo.png';

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

const searchTypeOptions = [
    { label: '제목에서 검색', value: 'TITLE' },
    { label: '저자에서 검색', value: 'AUTHOR' },
    { label: '출판사에서 검색', value: 'PUBLISHER' },
];

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [keyword, setKeyword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        setIsLoggedIn(hasLoginSession());
    }, [location.pathname, location.search]);

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

    const isActiveNav = (to: string) => {
        const searchParams = new URLSearchParams(location.search);
        const isHomeMorePage = location.pathname === '/books' && searchParams.get('source') === 'home';

        if (to === '/') return location.pathname === '/' || isHomeMorePage;
        if (to === '/books') return !isHomeMorePage && ((location.pathname === '/books' && searchParams.get('section') !== 'best') || location.pathname === '/search');
        return `${location.pathname}${location.search}` === to;
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = keyword.trim();
        if (!query) return;
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setIsSearchFocused(false);
    };

    const handleSuggestionClick = (event: MouseEvent<HTMLButtonElement>, searchType: string) => {
        event.preventDefault();
        const query = keyword.trim();
        if (!query) return;
        navigate(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
        setIsSearchFocused(false);
    };

    const handleNoResultClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const query = keyword.trim();
        if (!query) return;
        navigate(`/search?q=${encodeURIComponent(query)}&request=1`);
        setIsSearchFocused(false);
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

                <form className="abc-search" onSubmit={handleSearch}>
                    <button className="abc-search-button" type="submit" aria-label="검색">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                        </svg>
                    </button>
                    <input
                        className="abc-search-input"
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        onClick={() => setIsSearchFocused(true)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
                        aria-label="도서 검색"
                    />
                    {isSearchFocused && keyword.trim() ? (
                        <div className="abc-search-suggestions">
                            {searchTypeOptions.map((option) => (
                                <button type="button" onMouseDown={(event) => handleSuggestionClick(event, option.value)} key={option.value}>
                                    <strong>{keyword.trim()}</strong>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                            <div className="abc-search-no-result">
                                <span>검색 결과 없음</span>
                                <button type="button" onMouseDown={handleNoResultClick}>
                                    희망 도서 신청
                                </button>
                            </div>
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

                    <Link className="abc-profile-button" to={isLoggedIn ? '/me' : '/login'} aria-label="마이페이지">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="M5.5 19c.9-3.4 3.2-5.1 6.5-5.1s5.6 1.7 6.5 5.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                        </svg>
                    </Link>
                </div>
            </div>

            <nav className="abc-nav" aria-label="주요 메뉴">
                {navItems.map((item) => (
                    <Link key={item.label} className={`abc-nav-link ${isActiveNav(item.to) ? 'active' : ''}`} to={item.to}>
                        {item.label}
                    </Link>
                ))}
            </nav>
            </div>
        </header>
    );
}
