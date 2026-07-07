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
