import React, { useState, useEffect } from 'react';
import { useAuthStore, Company } from '../../store/authStore';
import { companyApi } from '../../services/companyApi';

const CompanyManagementPage = () => {
  const { isSuperAdmin, user } = useAuthStore();
  // 管理者権限の確認
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canManageCompanies = isSuperAdmin();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // 新規企業作成用の状態
  const [isCreating, setIsCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    logoUrl: '',
  });
  
  // 企業編集用の状態
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    logoUrl: '',
  });
  
  // 成功メッセージを表示して自動的に消す
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };
  
  // 企業一覧の取得
  const fetchCompanies = async (page = currentPage, limit = pageSize) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await companyApi.getCompanies({ page, limit });
      if (response.status === 'success') {
        setCompanies(response.data);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '企業一覧の取得に失敗しました');
      console.error('企業一覧の取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ページ変更ハンドラ
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCompanies(page);
  };
  
  // 初回レンダリング時に企業一覧を取得
  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin]);
  
  // 企業作成フォームの送信
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await companyApi.createCompany(newCompany);
      if (response.status === 'success') {
        // 企業一覧を再取得
        fetchCompanies();
        // フォームをリセット
        setNewCompany({
          name: '',
          logoUrl: '',
        });
        setIsCreating(false);
        showSuccessMessage('企業を作成しました');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '企業の作成に失敗しました');
      console.error('企業作成エラー:', error);
    }
  };
  
  // 企業編集フォームの送信
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCompany) return;
    
    try {
      const response = await companyApi.updateCompany(editingCompany.id, editForm);
      if (response.status === 'success') {
        // 企業一覧を再取得
        fetchCompanies();
        // 編集モードを終了
        setEditingCompany(null);
        showSuccessMessage('企業情報を更新しました');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '企業の更新に失敗しました');
      console.error('企業更新エラー:', error);
    }
  };
  
  // 企業削除の確認
  const handleDelete = async (company: Company) => {
    if (!window.confirm(`企業「${company.name}」を削除してもよろしいですか？`)) {
      return;
    }
    
    try {
      const response = await companyApi.deleteCompany(company.id);
      if (response.status === 'success') {
        // 企業一覧を再取得
        fetchCompanies();
        showSuccessMessage(`企業「${company.name}」を削除しました`);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '企業の削除に失敗しました');
      console.error('企業削除エラー:', error);
    }
  };
  
  // 編集モードの開始
  const startEditing = (company: Company) => {
    setEditingCompany(company);
    setEditForm({
      name: company.name,
      logoUrl: company.logoUrl || '',
    });
  };
  
  // 管理者でない場合はアクセス拒否
  if (!isAdmin) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-600 mb-4">アクセス権限がありません</h2>
        <p className="text-gray-600">
          この機能は管理者のみが利用できます。
        </p>
      </div>
    );
  }
  
  // ページネーションコンポーネント
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            i === currentPage
              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            前へ
          </button>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            次へ
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
              {' '}から{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>
              {' '}/ 全{' '}
              <span className="font-medium">{totalItems}</span>
              {' '}件
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">前へ</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {pages}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">次へ</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">企業一覧</h1>
        {canManageCompanies && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isCreating ? '作成をキャンセル' : '新規企業を作成'}
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">閉じる</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <span className="sr-only">閉じる</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 企業作成フォーム */}
      {isCreating && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">新規企業の作成</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                企業名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                ロゴURL
              </label>
              <input
                type="url"
                id="logoUrl"
                value={newCompany.logoUrl}
                onChange={(e) => setNewCompany({ ...newCompany, logoUrl: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                作成
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 企業編集フォーム */}
      {editingCompany && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            企業の編集: {editingCompany.name}
          </h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                企業名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-logoUrl" className="block text-sm font-medium text-gray-700">
                ロゴURL
              </label>
              <input
                type="url"
                id="edit-logoUrl"
                value={editForm.logoUrl}
                onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                更新
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 企業一覧 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">企業一覧</h2>
            <p className="mt-1 text-sm text-gray-500">
              システムに登録されている企業の一覧です。全{totalItems}件
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="pageSize" className="text-sm text-gray-700">表示件数:</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                fetchCompanies(1, newSize);
              }}
              className="border border-gray-300 rounded-md text-sm p-1"
            >
              <option value="5">5件</option>
              <option value="10">10件</option>
              <option value="20">20件</option>
              <option value="50">50件</option>
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-500">読み込み中...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-gray-500">企業が登録されていません。</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      企業名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      公開ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      更新日
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {company.logoUrl && (
                            <div className="flex-shrink-0 h-10 w-10 mr-3">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={company.logoUrl}
                                alt={`${company.name}のロゴ`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Logo';
                                }}
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{company.publicId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(company.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(company.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canManageCompanies && (
                          <>
                            <button
                              onClick={() => startEditing(company)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDelete(company)}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* ページネーション */}
            {totalPages > 1 && <Pagination />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyManagementPage;
