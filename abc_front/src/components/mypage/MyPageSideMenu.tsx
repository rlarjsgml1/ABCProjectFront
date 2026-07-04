import { NavLink } from 'react-router-dom';

const menuItems = [
  { label: '내 서재', to: '/me', enabled: true, end: true },
  { label: '즐겨찾기', to: '/me/favorites', enabled: true, end: true },
  { label: '최근 읽은 책', enabled: false },
  { label: '이용 내역', enabled: false },
  { label: '포인트/쿠폰', to: '/me/points-coupons', enabled: true, end: true },
  { label: '프로필 수정', to: '/me/profile', enabled: true, end: true },
  { label: '희망 도서 신청', enabled: false },
  { label: '희망 도서 신청 내역', enabled: false },
  { label: '결제 내역', enabled: false },
  { label: '신고 내역', enabled: false },
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
