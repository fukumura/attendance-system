import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, SetupPage } from './pages/auth';
import { DashboardPage } from './pages/dashboard';
import { AttendancePage } from './pages/attendance';
import { LeavePage } from './pages/leave';
import { ReportPage, CompanyReportPage } from './pages/report';
import { ProfilePage } from './pages/profile';
import { AdminDashboardPage, UserManagementPage, CompanyManagementPage, SuperAdminManagementPage } from './pages/admin';
import { ProtectedRoute, AdminProtectedRoute, SuperAdminProtectedRoute } from './components/auth';
import { Layout } from './components/layout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 認証が不要なルート */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/setup" element={<SetupPage />} />
        
        {/* 認証が必要なルート */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/attendance" element={
          <ProtectedRoute>
            <Layout>
              <AttendancePage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/leave" element={
          <ProtectedRoute>
            <Layout>
              <LeavePage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <ReportPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports/company" element={
          <AdminProtectedRoute>
            <CompanyReportPage />
          </AdminProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 管理者専用ルート */}
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <Layout>
              <AdminDashboardPage />
            </Layout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <AdminProtectedRoute>
            <Layout>
              <UserManagementPage />
            </Layout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/companies" element={
          <AdminProtectedRoute>
            <Layout>
              <CompanyManagementPage />
            </Layout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/super-admins" element={
          <SuperAdminProtectedRoute>
            <Layout>
              <SuperAdminManagementPage />
            </Layout>
          </SuperAdminProtectedRoute>
        } />
        
        {/* その他のルートはログインにリダイレクト */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
