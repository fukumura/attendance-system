import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface SuperAdminProtectedRouteProps {
  children: ReactNode;
}

const SuperAdminProtectedRoute = ({ children }: SuperAdminProtectedRouteProps) => {
  const { isAuthenticated, token, user } = useAuthStore();
  const location = useLocation();

  // 認証されていない場合はログインページにリダイレクト
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // スーパー管理者でない場合はダッシュボードにリダイレクト
  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SuperAdminProtectedRoute;
