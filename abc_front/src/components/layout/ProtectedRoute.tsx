import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const role = localStorage.getItem('memberRole');

  // 화면 검수 중에는 로그인 API 없이 U-014/U-015에 직접 진입할 수 있게 임시로 redirect를 막는다.
  // const token = localStorage.getItem('accessToken');
  // if (!token) {
  //   return <Navigate to="/login" replace />;
  // }

  if (requireAdmin && role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}
