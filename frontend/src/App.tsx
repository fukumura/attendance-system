import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, RegisterPage } from './pages/auth';
import DashboardPage from './pages/dashboard/DashboardPage';
import { AttendancePage } from './pages/attendance';
import ProtectedRoute from './components/auth/Protectedroute';
import { Layout } from './components/layout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 認証が不要なルート */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
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
        
        {/* その他のルートはログインにリダイレクト */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
