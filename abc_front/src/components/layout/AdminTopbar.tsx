// 관리자 공통 상단바 — 현재 화면명, 사용자 화면 보기, 관리자 이름, 로그아웃을 표시 (화면설계 문서 5번 Admin 상단 바 기준)
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_CHANGED_EVENT } from '../../api/authApi';

const authStorageKeys = ['accessToken', 'memberRole', 'memberId', 'loginId', 'memberName'];

type AdminPage = {
  path: string;
  label: string;
};

const adminPages: AdminPage[] = [
  { path: '/admin', label: '관리자 대시보드' },
  { path: '/admin/members', label: '회원 목록 관리' },
  { path: '/admin/members/:memberId', label: '회원 상세/상태 관리' },
  { path: '/admin/books', label: '도서 목록 관리' },
  { path: '/admin/books/new', label: '도서 등록' },
  { path: '/admin/books/:bookId/edit', label: '도서 수정' },
  { path: '/admin/categories', label: '카테고리 관리' },
  { path: '/admin/rentals', label: '대여 현황 관리' },
  { path: '/admin/payments', label: '결제 관리' },
  { path: '/admin/reports', label: '신고 관리' },
  { path: '/admin/book-requests', label: '희망도서 관리' },
  { path: '/admin/notices', label: '공지 관리' },
  { path: '/admin/coupons-points', label: '쿠폰/포인트 관리' },
  { path: '/admin/challenges', label: '챌린지 관리' },
  { path: '/admin/libraries', label: '도서관 위치 관리' },
  { path: '/admin/statistics', label: '통계 관리' },
  { path: '/admin/audit-logs', label: '감사 로그' },
  { path: '/admin/collections', label: '컬렉션 관리' },
  { path: '/admin/settings', label: '설정' },
];

function findCurrentPage(pathname: string) {
  return adminPages.find((page) => matchPath({ path: page.path, end: true }, pathname));
}

export function AdminTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = findCurrentPage(location.pathname);
  const adminName = localStorage.getItem('memberName') || '관리자';

  function handleLogout() {
    authStorageKeys.forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    navigate('/login');
  }

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-title">
        <span className="admin-topbar-badge">관리자</span>
        <h1>{currentPage ? currentPage.label : '관리자'}</h1>
      </div>

      <div className="admin-topbar-actions">
        <a className="admin-topbar-link" href="/" target="_blank" rel="noreferrer">
          사용자 화면 보기
        </a>
        <span className="admin-topbar-name">{adminName}</span>
        <button className="admin-topbar-logout" type="button" onClick={handleLogout}>
          로그아웃
        </button>
        <span className="admin-topbar-avatar" aria-hidden="true">
          {adminName.slice(0, 1)}
        </span>
      </div>
    </header>
  );
}
