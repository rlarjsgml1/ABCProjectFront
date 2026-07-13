import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
