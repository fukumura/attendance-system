import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const AdminDashboardPage = () => {
  const { user, isSuperAdmin } = useAuthStore();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">管理者ダッシュボード</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">管理者メニュー</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="bg-blue-50 rounded-lg p-6 hover:bg-blue-100 transition-colors"
          >
            <h3 className="text-lg font-medium mb-2 text-blue-700">ユーザー管理</h3>
            <p className="text-gray-600">ユーザーの追加、編集、削除を行います</p>
          </Link>
          <Link
            to="/reports"
            className="bg-green-50 rounded-lg p-6 hover:bg-green-100 transition-colors"
          >
            <h3 className="text-lg font-medium mb-2 text-green-700">レポート</h3>
            <p className="text-gray-600">勤怠や休暇のレポートを確認します</p>
          </Link>
          <Link
            to="/admin/companies"
            className="bg-indigo-50 rounded-lg p-6 hover:bg-indigo-100 transition-colors"
          >
            <h3 className="text-lg font-medium mb-2 text-indigo-700">企業一覧</h3>
            <p className="text-gray-600">登録されている企業の一覧を表示します</p>
          </Link>
          
          {isSuperAdmin() && (
            <Link
              to="/admin/super-admins"
              className="bg-purple-50 rounded-lg p-6 hover:bg-purple-100 transition-colors"
            >
              <h3 className="text-lg font-medium mb-2 text-purple-700">スーパー管理者管理</h3>
              <p className="text-gray-600">スーパー管理者の追加を行います</p>
            </Link>
          )}
          
          {!isSuperAdmin() && (
            <div className="bg-purple-50 rounded-lg p-6 hover:bg-purple-100 transition-colors">
              <h3 className="text-lg font-medium mb-2 text-purple-700">システム設定</h3>
              <p className="text-gray-600">システム全体の設定を管理します（準備中）</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">システム情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium mb-2">管理者情報</h3>
            <p className="text-gray-600 mb-1">名前: {user?.name}</p>
            <p className="text-gray-600 mb-1">メール: {user?.email}</p>
            <p className="text-gray-600">ロール: {user?.role}</p>
          </div>
          <div>
            <h3 className="text-md font-medium mb-2">システムステータス</h3>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <p className="text-gray-600">データベース: 正常</p>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <p className="text-gray-600">API: 正常</p>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <p className="text-gray-600">認証システム: 正常</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
