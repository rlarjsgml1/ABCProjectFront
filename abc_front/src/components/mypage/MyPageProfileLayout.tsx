// 마이페이지 하위 라우트 공통 래퍼 — 로그인 보호를 제공한다. 내 프로필 Context는 UserLayout에서 이미 제공된다.
import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../layout/ProtectedRoute';

export function MyPageProfileLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}
