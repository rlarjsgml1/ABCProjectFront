// 마이페이지 하위 라우트 공통 래퍼 — 로그인 보호와 내 프로필 Context를 함께 제공
import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../layout/ProtectedRoute';
import { MyProfileProvider } from '../../context/MyProfileContext';

export function MyPageProfileLayout() {
  return (
    <ProtectedRoute>
      <MyProfileProvider>
        <Outlet />
      </MyProfileProvider>
    </ProtectedRoute>
  );
}
