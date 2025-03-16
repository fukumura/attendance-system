import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // URLパラメータからトークンとユーザーIDを取得
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        
        if (!token || !userId) {
          setError('無効な認証リンクです。トークンまたはユーザーIDが不足しています。');
          setIsVerifying(false);
          return;
        }
        
        // メール認証APIの呼び出し
        const response = await authApi.verifyEmail(token, userId);
        
        if (response.status === 'success') {
          setIsSuccess(true);
          
          // ユーザー情報とトークンを保存
          if (response.data?.user && response.data?.token) {
            login(response.data.user, null, response.data.token);
            
            // 3秒後にダッシュボードにリダイレクト
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          }
        } else {
          setError('認証に失敗しました。リンクが無効か期限切れの可能性があります。');
        }
      } catch (error: any) {
        setError(error.response?.data?.message || '認証に失敗しました。リンクが無効か期限切れの可能性があります。');
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyEmail();
  }, [searchParams, navigate, login]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          メールアドレス認証
        </h2>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isVerifying ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">認証中...</p>
            </div>
          ) : isSuccess ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">メールアドレスが認証されました</p>
              <p className="mt-2 text-gray-600">
                ダッシュボードに自動的にリダイレクトします...
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">認証に失敗しました</p>
              <p className="mt-2 text-gray-600">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ログインページに戻る
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
