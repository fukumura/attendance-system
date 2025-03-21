import React from 'react';
import { Layout } from '../../components/layout';
import CompanyComplianceReport from '../../components/report/CompanyComplianceReport';
import { useAuthStore } from '../../store/authStore';
import { Navigate } from 'react-router-dom';

const CompanyReportPage: React.FC = () => {
  const { user } = useAuthStore();
  
  // 管理者権限チェック
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  // 管理者でない場合はダッシュボードにリダイレクト
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">会社コンプライアンスレポート</h1>
          <p className="text-gray-600">
            会社全体の勤怠状況とコンプライアンス指標を確認できます。
            労働基準法に基づく各種指標を可視化し、適切な労務管理をサポートします。
          </p>
        </div>
        
        <CompanyComplianceReport />
      </div>
    </Layout>
  );
};

export default CompanyReportPage;
