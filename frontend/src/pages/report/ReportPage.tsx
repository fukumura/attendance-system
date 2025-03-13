import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { UserReport, DepartmentReport } from '../../components/report';

const ReportPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'user' | 'department'>(isAdmin ? 'department' : 'user');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">レポート</h1>
      
      {/* タブナビゲーション（管理者のみ部門レポートを表示） */}
      {isAdmin && (
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'department'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('department')}
          >
            部門レポート
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'user'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('user')}
          >
            個人レポート
          </button>
        </div>
      )}
      
      {/* タブコンテンツ */}
      <div className="mb-8">
        {activeTab === 'user' && (
          <UserReport userId={user?.id} />
        )}
        
        {activeTab === 'department' && isAdmin && (
          <DepartmentReport />
        )}
      </div>
    </div>
  );
};

export default ReportPage;
