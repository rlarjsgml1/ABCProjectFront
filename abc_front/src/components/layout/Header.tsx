import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
    { to: '/', label: 'HOME' },
    { to: '/books', label: '도서' },
    { to: '/books?section=best', label: '베스트' },
    //{ to: '/books?category=web-novel', label: '웹소설' },
    //{ to: '/books?category=comic', label: '만화' },
    //{ to: '/books?type=ebook', label: 'e북' },
    { to: '/notices', label: '공지사항' },
];

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [keyword, setKeyword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(Boolean(localStorage.getItem('accessToken')));
    }, []);

    const isActiveNav = (to: string) => {
        if (to === '/') return location.pathname === '/';
        if (to === '/books') return location.pathname === '/books' && location.search === '';
        return `${location.pathname}${location.search}` === to;
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = keyword.trim();
        if (!query) return;
        navigate(`/search?q=${encodeURIComponent(query)}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
        navigate('/');
    };

    return (
        <header className="abc-header">
            <div className="abc-header-top">
                <Link className="abc-logo" to="/">ABC</Link>

                <form className="abc-search" onSubmit={handleSearch}>
                    <button className="abc-search-button" type="submit" aria-label="검색">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                        </svg>
                    </button>
                    <input className="abc-search-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} aria-label="도서 검색" />
                </form>

                <div className="abc-actions">
                    {isLoggedIn ? (
                        <button className="abc-dark-button" type="button" onClick={handleLogout}>로그아웃</button>
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
        </header>
    );
}