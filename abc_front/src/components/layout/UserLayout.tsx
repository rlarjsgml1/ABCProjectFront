// 일반 사용자 공통 레이아웃 — 헤더/푸터와 맨 위로 이동 버튼을 포함한 화면 뼈대
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';

export function UserLayout() {
    const location = useLocation();
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        // 마이페이지 내부 이동은 사이드바/헤더가 고정된 대시보드형 화면이라 스크롤 위치를 유지한다.
        if (location.pathname.startsWith('/me')) {
            return;
        }

        window.scrollTo({ top: 0, left: 0 });
    }, [location.pathname, location.search]);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 320);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="app-shell">
            <Header />

            <main className="site-main">
                <Outlet />
            </main>

            <Footer />

            <button
                className={`scroll-top-button ${showScrollTop ? 'is-visible' : ''}`}
                type="button"
                onClick={scrollToTop}
                aria-label="맨 위로 이동"
            >
                ↑
            </button>
        </div>
    );
}
