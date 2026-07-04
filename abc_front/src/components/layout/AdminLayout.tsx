import { Link, Outlet } from 'react-router-dom';

const adminNavItems = [
  { to: '/admin', label: '관리자 대시보드' },
  { to: '/admin/members', label: '회원 목록 관리' },
  { to: '/admin/members/:memberId', label: '회원 상세/상태 관리' },
  { to: '/admin/books', label: '도서 목록 관리' },
  { to: '/admin/books/new', label: '도서 등록' },
  { to: '/admin/books/:bookId/edit', label: '도서 수정' },
  { to: '/admin/categories', label: '카테고리 관리' },
  { to: '/admin/rentals', label: '대여 현황 관리' },
  { to: '/admin/payments', label: '결제 관리' },
  { to: '/admin/reports', label: '신고 관리' },
  { to: '/admin/book-requests', label: '희망도서 관리' },
  { to: '/admin/notices', label: '공지 관리' },
  { to: '/admin/coupons-points', label: '쿠폰/포인트 관리' },
  { to: '/admin/challenges', label: '챌린지 관리' },
  { to: '/admin/libraries', label: '도서관 위치 관리' },
  { to: '/admin/statistics', label: '통계 관리' },
  { to: '/admin/audit-logs', label: '관리자 감사 로그' },
  { to: '/admin/collections', label: '컬렉션 관리' },
];

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="site-logo" to="/admin">
          ABC Admin
        </Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          {adminNavItems.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
