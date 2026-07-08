import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const isPreviewLogin = true; // U-027 화면 확인용 임시 로그인 처리. PR 전 제거 필요.
  const role = localStorage.getItem('memberRole');
  const token = localStorage.getItem('accessToken');

  if (!token && !isPreviewLogin) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}
