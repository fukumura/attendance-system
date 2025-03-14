// frontend/src/pages/auth/LoginPage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import { useAuthStore } from '../../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // 既に認証済みの場合はダッシュボードへリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">WorkSync</h1>
        <p className="text-gray-600 text-lg">つながる勤怠、広がる生産性</p>
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <LoginForm />
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        &copy; 2025 WorkSync | プライバシーポリシー
      </div>
    </div>
  );
};

export default LoginPage