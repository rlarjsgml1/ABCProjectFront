// 관리자 공통 레이아웃 — 사이드바, 상단바, 콘텐츠 영역(Outlet)으로 구성된 어드민 페이지 뼈대
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-content">
        <AdminTopbar />
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
