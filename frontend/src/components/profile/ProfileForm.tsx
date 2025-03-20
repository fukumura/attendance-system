import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore, Company } from '../../store/authStore';
import { companyApi } from '../../services/companyApi';

interface ProfileFormProps {
  onSuccess?: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const { user, company } = useAuthStore();
  const { handleProfileUpdate, handleCompanyUpdate, isSubmitting, setError } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  
  // スーパー管理者かどうかを判定
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  // ユーザー情報が変更されたら、フォームの値を更新
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setCompanyId(user.companyId || null);
    }
  }, [user]);
  
  // 編集モードになったらスーパー管理者の場合のみ企業一覧を取得
  useEffect(() => {
    if (isEditing && isSuperAdmin) {
      fetchCompanies();
    }
  }, [isEditing, isSuperAdmin]);
  
  // 企業一覧を取得
  const fetchCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const response = await companyApi.getCompanies();
      if (response.status === 'success') {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error('企業一覧の取得に失敗しました:', error);
      setError('企業一覧の取得に失敗しました');
    } finally {
      setIsLoadingCompanies(false);
    }
  };
  
  // 編集モードの切り替え
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setSuccessMessage('');
    
    // 編集をキャンセルした場合は、元の値に戻す
    if (isEditing && user) {
      setName(user.name);
      setEmail(user.email);
      setCompanyId(user.companyId || null);
    }
  };
  
  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!name.trim() || !email.trim()) {
      setError('名前とメールアドレスは必須です');
      return;
    }
    
    // プロフィール情報の更新
    const success = await handleProfileUpdate(name, email);
    
    // スーパー管理者の場合のみ企業情報の更新（変更があった場合のみ）
    let companySuccess = true;
    if (success && user && isSuperAdmin && companyId !== user.companyId) {
      companySuccess = await handleCompanyUpdate(companyId);
    }
    
    if (success && companySuccess) {
      setSuccessMessage('プロフィールが更新されました');
      setIsEditing(false);
      if (onSuccess) {
        onSuccess();
      }
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">プロフィール情報</h2>
        <button
          type="button"
          onClick={toggleEditMode}
          className={`px-4 py-2 rounded text-sm font-medium ${
            isEditing
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          {isEditing ? 'キャンセル' : '編集'}
        </button>
      </div>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* スーパー管理者の場合のみ企業選択ドロップダウンを表示 */}
          {isSuperAdmin && (
            <div className="mb-4">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                所属企業
              </label>
              <select
                id="company"
                value={companyId || ''}
                onChange={(e) => setCompanyId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingCompanies}
              >
                <option value="">-- 企業を選択 --</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {isLoadingCompanies && (
                <p className="text-sm text-gray-500 mt-1">企業情報を読み込み中...</p>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? '更新中...' : '保存'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">名前</p>
            <p className="text-gray-800">{user?.name}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">メールアドレス</p>
            <p className="text-gray-800">{user?.email}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">所属企業</p>
            <p className="text-gray-800">{company?.name || '未所属'}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">ロール</p>
            <p className="text-gray-800">
              {user?.role === 'ADMIN' 
                ? '管理者' 
                : user?.role === 'SUPER_ADMIN'
                  ? 'スーパー管理者'
                  : '一般ユーザー'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileForm;
