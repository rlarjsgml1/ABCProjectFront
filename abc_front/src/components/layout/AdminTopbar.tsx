// 관리자 공통 상단바 — 현재 화면명, 사용자 화면 보기, 관리자 이름, 로그아웃을 표시 (화면설계 문서 5번 Admin 상단 바 기준)
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_CHANGED_EVENT } from '../../api/authApi';

const authStorageKeys = ['accessToken', 'memberRole', 'memberId', 'loginId', 'memberName'];

type AdminPage = {
  path: string;
  id: string;
  label: string;
};

const adminPages: AdminPage[] = [
  { path: '/admin', id: 'A-001', label: '관리자 대시보드' },
  { path: '/admin/members', id: 'A-002', label: '회원 목록 관리' },
  { path: '/admin/members/:memberId', id: 'A-003', label: '회원 상세/상태 관리' },
  { path: '/admin/books', id: 'A-004', label: '도서 목록 관리' },
  { path: '/admin/books/new', id: 'A-005', label: '도서 등록' },
  { path: '/admin/books/:bookId/edit', id: 'A-006', label: '도서 수정' },
  { path: '/admin/categories', id: 'A-007', label: '카테고리 관리' },
  { path: '/admin/rentals', id: 'A-008', label: '대여 현황 관리' },
  { path: '/admin/payments', id: 'A-009', label: '결제 관리' },
  { path: '/admin/reports', id: 'A-010', label: '신고 관리' },
  { path: '/admin/book-requests', id: 'A-011', label: '희망도서 관리' },
  { path: '/admin/notices', id: 'A-012', label: '공지 관리' },
  { path: '/admin/coupons-points', id: 'A-013', label: '쿠폰/포인트 관리' },
  { path: '/admin/challenges', id: 'A-014', label: '챌린지 관리' },
  { path: '/admin/libraries', id: 'A-015', label: '도서관 위치 관리' },
  { path: '/admin/statistics', id: 'A-016', label: '통계 관리' },
  { path: '/admin/audit-logs', id: 'A-017', label: '감사 로그' },
  { path: '/admin/collections', id: 'A-018', label: '컬렉션 관리' },
  { path: '/admin/settings', id: '', label: '설정' },
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
