import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const navigate = useNavigate();
  const { login, logout, setIsLoading, setError } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ユーザー登録
  const handleRegister = async (email: string, password: string, name: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await authApi.register(email, password, name);
      if (response.status === 'success') {
        // ユーザー情報とトークンを保存
        login(response.data, response.data.token);
        // ダッシュボードにリダイレクト
        navigate('/dashboard');
        return true;
      }
    } catch (error: any) {
      // エラーメッセージの設定
      const errorMessage =
        error.response?.data?.message || '登録中にエラーが発生しました';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ログイン
  const handleLogin = async (email: string, password: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await authApi.login(email, password);
      if (response.status === 'success') {
        // ユーザー情報とトークンを保存
        login(response.data, response.data.token);
        // ダッシュボードにリダイレクト
        navigate('/dashboard');
        return true;
      }
    } catch (error: any) {
      // エラーメッセージの設定
      const errorMessage =
        error.response?.data?.message || 'ログイン中にエラーが発生しました';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ログアウト
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 現在のユーザー情報を取得
  const fetchCurrentUser = async () => {
    setIsLoading(true);
    
    try {
      const response = await authApi.getCurrentUser();
      if (response.status === 'success') {
        // ユーザー情報を更新（トークンはそのまま）
        useAuthStore.getState().setUser(response.data);
        return response.data;
      }
    } catch (error) {
      // エラーが発生した場合はログアウト
      logout();
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSubmitting,
    handleRegister,
    handleLogin,
    handleLogout,
    fetchCurrentUser,
  };
};