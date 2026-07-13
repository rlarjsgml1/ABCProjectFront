// 관리자 사이드바 — 메뉴 그룹별 내비게이션 링크와 로그아웃 기능을 제공
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AUTH_CHANGED_EVENT } from '../../api/authApi';

const authStorageKeys = ['accessToken', 'memberRole', 'memberId', 'loginId', 'memberName'];

type AdminNavItem = {
  to: string;
  label: string;
  tag: string;
};

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [{ to: '/admin', label: '관리자 대시보드', tag: 'Home' }],
  },
  {
    label: '회원',
    items: [{ to: '/admin/members', label: '회원 목록 관리', tag: 'List' }],
  },
  {
    label: '도서',
    items: [
      { to: '/admin/books', label: '도서 목록 관리', tag: 'List' },
      { to: '/admin/categories', label: '카테고리 관리', tag: 'Tree' },
    ],
  },
  {
    label: '운영',
    items: [
      { to: '/admin/rentals', label: '대여 현황 관리', tag: 'Rent' },
      { to: '/admin/payments', label: '결제 관리', tag: 'Pay' },
      { to: '/admin/reports', label: '신고 관리', tag: 'Report' },
      { to: '/admin/book-requests', label: '희망도서 관리', tag: 'Wish' },
      { to: '/admin/notices', label: '공지 관리', tag: 'Notice' },
    ],
  },
  {
    label: '보상/콘텐츠',
    items: [
      { to: '/admin/coupons-points', label: '쿠폰/포인트 관리', tag: 'Benefit' },
      { to: '/admin/challenges', label: '챌린지/보상 관리', tag: 'Reward' },
      { to: '/admin/libraries', label: '도서관 위치 관리', tag: 'Hold' },
      { to: '/admin/collections', label: '컬렉션 관리', tag: 'Series' },
    ],
  },
  {
    label: '분석',
    items: [{ to: '/admin/statistics', label: '통계 관리', tag: 'Chart' }],
  },
  {
    label: '시스템',
    items: [
      { to: '/admin/audit-logs', label: '감사 로그', tag: 'Audit' },
      { to: '/admin/settings', label: '설정', tag: 'Config' },
    ],
  },
];

export function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authStorageKeys.forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    navigate('/login');
  };

  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" to="/admin">
        <span className="admin-brand-mark" aria-hidden="true">ABC</span>
        <span className="admin-brand-text">
          <strong>Acorn Book Cloud</strong>
          <small>전체 관리자 화면</small>
        </span>
      </Link>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {adminNavGroups.map((group) => (
          <div className="admin-sidebar-group" key={group.label}>
            <p className="admin-sidebar-group-label">{group.label}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) => `admin-sidebar-link${isActive ? ' is-active' : ''}`}
              >
                <span>{item.label}</span>
                <span className="admin-sidebar-tag">{item.tag}</span>
              </NavLink>
            ))}
          </div>
        ))}

        <div className="admin-sidebar-group">
          <button className="admin-sidebar-link" type="button" onClick={handleLogout}>
            <span className="admin-sidebar-logout-label">로그아웃</span>
            <span className="admin-sidebar-tag">Exit</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
