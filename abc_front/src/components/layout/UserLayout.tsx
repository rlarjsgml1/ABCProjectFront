import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';

export function UserLayout() {
    const [showScrollTop, setShowScrollTop] = useState(false);

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
