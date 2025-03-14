import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth';
import { DashboardPage } from './pages/dashboard';
import { AttendancePage } from './pages/attendance';
import { LeavePage } from './pages/leave';
import { ReportPage } from './pages/report';
import { AdminDashboardPage, UserManagementPage } from './pages/admin';
import ProtectedRoute from './components/auth/Protectedroute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import { Layout } from './components/layout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 認証が不要なルート */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        
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
        
        {/* その他のルートはログインにリダイレクト */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
