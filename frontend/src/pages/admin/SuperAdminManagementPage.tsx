import React from 'react';
import { useAuthStore } from '../../store/authStore';
import CreateSuperAdminForm from '../../components/admin/CreateSuperAdminForm';

const SuperAdminManagementPage: React.FC = () => {
  const { isSuperAdmin } = useAuthStore();

  // スーパー管理者でない場合はアクセス拒否
  if (!isSuperAdmin()) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-600 mb-4">アクセス権限がありません</h2>
        <p className="text-gray-600">
          この機能はスーパー管理者のみが利用できます。
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">スーパー管理者管理</h1>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          スーパー管理者は、すべての企業データにアクセスでき、企業の作成・管理を行うことができます。
          スーパー管理者の作成は、既存のスーパー管理者のみが行えます。
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                スーパー管理者権限は慎重に付与してください。この権限を持つユーザーはシステム全体にアクセスできます。
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <CreateSuperAdminForm />
      </div>
    </div>
  );
};

export default SuperAdminManagementPage;
