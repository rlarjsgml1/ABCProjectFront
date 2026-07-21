// 마이페이지 사이드 메뉴 — 내 서재/대여/즐겨찾기 등 하위 메뉴 내비게이션 목록
import { NavLink } from 'react-router-dom';

const menuItems = [
  { label: '내 서재', to: '/me', enabled: true, end: true },
  { label: '알림', to: '/me/notifications', enabled: true, end: true },
  { label: '대여 현황', to: '/me/rentals', enabled: true, end: true },
  { label: '챌린지', to: '/me/challenges', enabled: true, end: true },
  { label: '즐겨찾기', to: '/me/favorites', enabled: true, end: true },
  { label: '최근 읽은 책', to: '/me/recent-books', enabled: true, end: true },
  { label: '독서 통계', to: '/me/statistics', enabled: true, end: true },
  { label: '포인트/쿠폰', to: '/me/points-coupons', enabled: true, end: true },
  { label: '프로필 수정', to: '/me/profile', enabled: true, end: true },
  { label: '희망 도서 신청 내역', to: '/me/book-requests/history', enabled: true, end: true },
  { label: '이용/결제 내역', to: '/me/payments', enabled: true, end: true },
  { label: '신고 내역', to: '/me/reports', enabled: true, end: true },
];

export function MyPageSideMenu() {
  return (
    <aside className="mypage-side page-section" aria-label="마이페이지 메뉴">
      <p className="eyebrow">MY MENU</p>
      <nav className="mypage-menu">
        {menuItems.map((item) =>
          item.enabled && item.to ? (
            <NavLink
              key={item.label}
              className={({ isActive }) => `mypage-menu-link${isActive ? ' is-active' : ''}`}
              end={item.end}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ) : (
            <span key={item.label} className="mypage-menu-link is-disabled" aria-disabled="true">
              {item.label}
            </span>
          ),
        )}
      </nav>
    </aside>
  );
}
