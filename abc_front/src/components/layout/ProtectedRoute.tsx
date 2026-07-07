import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

const TEMP_RENT_PAYMENT_TEST_LOGIN = true;

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const role = localStorage.getItem('memberRole') ?? (TEMP_RENT_PAYMENT_TEST_LOGIN ? 'USER' : null);
  const token = localStorage.getItem('accessToken') ?? (TEMP_RENT_PAYMENT_TEST_LOGIN ? 'temp-rent-payment-token' : null);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}
