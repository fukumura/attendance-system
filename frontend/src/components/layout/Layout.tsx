import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 現在のパスに基づいてナビゲーションアイテムのアクティブ状態を判定
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">勤怠管理システム</h1>
              </div>
              <nav className="ml-6 flex space-x-4">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  ダッシュボード
                </Link>
                <Link
                  to="/attendance"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/attendance')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  勤怠管理
                </Link>
                <Link
                  to="/leave"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/leave')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  休暇申請
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/reports"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/reports')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    レポート
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-sm text-gray-700 mr-4">
                  {user?.name || 'ユーザー'}さん
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-white shadow mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-center text-gray-500">
            &copy; 2025 勤怠管理システム
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
