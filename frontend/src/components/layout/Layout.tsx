import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // モバイルメニューが開いているときに画面外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('#mobile-menu') && !target.closest('#menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // ページ遷移時にモバイルメニューを閉じる
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 現在のパスに基づいてナビゲーションアイテムのアクティブ状態を判定
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // ナビゲーションリンクコンポーネント
  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link
      to={to}
      className={`${
        isActive(to) || (to === '/admin' && location.pathname.startsWith('/admin/'))
          ? 'border-blue-500 text-gray-900 bg-blue-50 md:bg-transparent'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 md:hover:bg-transparent'
      } ${
        isMobileMenuOpen
          ? 'block pl-3 pr-4 py-2 text-base font-medium border-l-4 md:inline-flex md:items-center md:px-1 md:pt-1 md:border-b-2 md:border-l-0 md:text-sm'
          : 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
      }`}
    >
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex justify-between flex-1 md:justify-start">
              {/* ロゴ */}
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg md:text-xl font-bold text-gray-900">勤怠管理システム</h1>
              </div>
              
              {/* デスクトップナビゲーション */}
              <nav className="hidden md:ml-6 md:flex md:space-x-4">
                <NavLink to="/dashboard">ダッシュボード</NavLink>
                <NavLink to="/attendance">勤怠管理</NavLink>
                <NavLink to="/leave">休暇申請</NavLink>
                <NavLink to="/reports">レポート</NavLink>
                {user?.role === 'ADMIN' && (
                  <NavLink to="/admin">管理者</NavLink>
                )}
              </nav>
              
              {/* モバイルメニューボタン */}
              <div className="flex items-center md:hidden">
                <button
                  id="menu-button"
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-expanded="false"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <span className="sr-only">メニューを開く</span>
                  {/* ハンバーガーアイコン */}
                  {!isMobileMenuOpen ? (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* デスクトップユーザーメニュー */}
            <div className="hidden md:flex md:items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/profile"
                  className={`text-sm font-medium mr-4 flex items-center ${
                    isActive('/profile')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">{user?.name || 'ユーザー'}さん</span>
                </Link>
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
        
        {/* モバイルメニュー */}
        <div
          id="mobile-menu"
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="pt-2 pb-3 space-y-1 border-t border-gray-200">
            <NavLink to="/dashboard">ダッシュボード</NavLink>
            <NavLink to="/attendance">勤怠管理</NavLink>
            <NavLink to="/leave">休暇申請</NavLink>
            <NavLink to="/reports">レポート</NavLink>
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin">管理者</NavLink>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name || 'ユーザー'}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/profile"
                className={`block px-4 py-2 text-base font-medium ${
                  isActive('/profile')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                プロフィール
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-grow max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-white shadow py-4 mt-auto">
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
