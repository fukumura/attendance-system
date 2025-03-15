import React, { useState, FormEvent } from 'react';
import { adminApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// メールアドレスのバリデーション用正規表現
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface CreateSuperAdminFormProps {
  onSuccess?: () => void;
}

const CreateSuperAdminForm: React.FC<CreateSuperAdminFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { isSuperAdmin } = useAuthStore();
  
  // スーパー管理者でない場合はアクセス拒否
  if (!isSuperAdmin()) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700">この機能はスーパー管理者のみが利用できます。</p>
      </div>
    );
  }
  
  // フォームのバリデーション
  const validateForm = (): boolean => {
    // メールアドレスのバリデーション
    if (!email.trim() || !EMAIL_REGEX.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return false;
    }
    
    // パスワードのバリデーション
    if (!password || password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return false;
    }
    
    // 名前のバリデーション
    if (!name.trim()) {
      setError('名前を入力してください');
      return false;
    }
    
    return true;
  };
  
  // フォーム送信ハンドラ
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await adminApi.createSuperAdmin({
        email,
        password,
        name,
      });
      
      if (response.status === 'success') {
        setSuccess('スーパー管理者を作成しました');
        // フォームをリセット
        setEmail('');
        setPassword('');
        setName('');
        
        // 成功コールバックがあれば実行
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'スーパー管理者の作成に失敗しました');
      console.error('スーパー管理者作成エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">新規スーパー管理者の作成</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            パスワード <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            minLength={6}
          />
          <p className="mt-1 text-xs text-gray-500">6文字以上で入力してください</p>
        </div>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '作成中...' : 'スーパー管理者を作成'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSuperAdminForm;
