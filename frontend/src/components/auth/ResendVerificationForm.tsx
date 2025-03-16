import { useState } from 'react';
import { authApi } from '../../services/api';

interface ResendVerificationFormProps {
  email: string;
  onClose: () => void;
}

const ResendVerificationForm = ({ email, onClose }: ResendVerificationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleResendVerification = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await authApi.resendVerification(email);
      
      if (response.status === 'success') {
        setIsSuccess(true);
      } else {
        setError('認証メールの再送信に失敗しました。');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '認証メールの再送信中にエラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">メール認証が必要です</h2>
        <p className="text-gray-600 mt-2">
          アカウントを使用するには、メールアドレスの認証が必要です。
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {isSuccess ? (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-800 font-medium">認証メールを送信しました</p>
          <p className="text-gray-600 mt-2">
            {email} 宛に認証メールを送信しました。メールを確認して、認証リンクをクリックしてください。
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            閉じる
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-800 mb-4">
            <span className="font-medium">{email}</span> 宛に認証メールを送信しました。メールを確認して、認証リンクをクリックしてください。
          </p>
          <p className="text-gray-600 mb-6">
            メールが届かない場合は、以下のボタンをクリックして再送信できます。
          </p>
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleResendVerification}
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '送信中...' : '認証メールを再送信'}
            </button>
            
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResendVerificationForm;
