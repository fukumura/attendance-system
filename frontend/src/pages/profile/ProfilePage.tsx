import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { ProfileForm, PasswordChangeForm } from '../../components/profile';

const ProfilePage: React.FC = () => {
  const { user, error } = useAuthStore();
  const { fetchCurrentUser } = useAuth();
  
  // ページロード時にユーザー情報を取得
  useEffect(() => {
    fetchCurrentUser();
  }, []);
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">アカウント設定</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        <ProfileForm />
        <PasswordChangeForm />
      </div>
    </div>
  );
};

export default ProfilePage;
