import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAuthStore } from '../../store/authStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // 既に認証済みの場合はダッシュボードへリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">WorkSync</h1>
          <p className="text-gray-600">つながる勤怠、広がる生産性</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;