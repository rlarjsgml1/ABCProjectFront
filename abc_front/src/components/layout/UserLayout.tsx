import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function UserLayout() {
    return (
        <div className="app-shell">
            <Header />

            <main className="site-main">
                <Outlet />
            </main>

            <footer className="site-footer">Acorn Book Cloud</footer>
        </div>
    );
}