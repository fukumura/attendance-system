import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { companyApi } from '../../services/companyApi';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, company, logout, isSuperAdmin, switchCompany } = useAuthStore();
  const [isCompanySwitcherOpen, setIsCompanySwitcherOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // モバイルメニューとカンパニースイッチャーが開いているときに画面外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('#mobile-menu') && !target.closest('#menu-button')) {
        setIsMobileMenuOpen(false);
      }
      if (isCompanySwitcherOpen && !target.closest('#company-switcher') && !target.closest('#company-switcher-button')) {
        setIsCompanySwitcherOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen, isCompanySwitcherOpen]);
  
  // スーパー管理者の場合、企業一覧を取得
  useEffect(() => {
    if (isSuperAdmin() && isCompanySwitcherOpen && companies.length === 0) {
      setIsLoadingCompanies(true);
      companyApi.getCompanies()
        .then(response => {
          if (response.status === 'success') {
            setCompanies(response.data.data);
          }
        })
        .catch(error => {
          console.error('企業一覧の取得に失敗しました:', error);
        })
        .finally(() => {
          setIsLoadingCompanies(false);
        });
    }
  }, [isSuperAdmin, isCompanySwitcherOpen, companies.length]);

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
              {/* ロゴと企業名 */}
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg md:text-xl font-bold text-gray-900">勤怠管理システム</h1>
                {company && (
                  <div className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                    {company.name}
                  </div>
                )}
                
                {/* スーパー管理者用企業切り替えボタン */}
                {isSuperAdmin() && (
                  <div className="relative ml-2">
                    <button
                      id="company-switcher-button"
                      type="button"
                      className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setIsCompanySwitcherOpen(!isCompanySwitcherOpen)}
                    >
                      <span>{company ? '企業切替' : '企業選択'}</span>
                      <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* 企業切り替えドロップダウン */}
                    {isCompanySwitcherOpen && (
                      <div
                        id="company-switcher"
                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"
                      >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {isLoadingCompanies ? (
                            <div className="px-4 py-2 text-sm text-gray-500">読み込み中...</div>
                          ) : companies.length > 0 ? (
                            companies.map(companyItem => (
                              <button
                                key={companyItem.id}
                                className={`w-full text-left block px-4 py-2 text-sm ${
                                  company?.id === companyItem.id
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => {
                                  switchCompany(companyItem);
                                  setIsCompanySwitcherOpen(false);
                                }}
                              >
                                {companyItem.name}
                                <span className="ml-2 text-xs text-gray-500">
                                  {companyItem.publicId}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">企業が見つかりません</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* デスクトップナビゲーション */}
              <nav className="hidden md:ml-6 md:flex md:space-x-4">
                <NavLink to="/dashboard">ダッシュボード</NavLink>
                <NavLink to="/attendance">勤怠管理</NavLink>
                <NavLink to="/leave">休暇申請</NavLink>
                <NavLink to="/reports">レポート</NavLink>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
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
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
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
