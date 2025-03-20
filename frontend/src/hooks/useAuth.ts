import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, adminApi } from '../services/api';
import { useAuthStore, Company } from '../store/authStore';
import { companyApi } from '../services/companyApi';

export const useAuth = () => {
  const navigate = useNavigate();
  const { login, logout, setIsLoading, setError: storeSetError, setUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // エラーメッセージを設定する関数を公開
  const setError = (message: string | null) => {
    storeSetError(message);
  };

  // ユーザー登録（一般ユーザー向け）
  const handleRegister = async (email: string, password: string, name: string, isAdmin = false) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 管理者による登録か一般ユーザーによる登録かで分岐
      if (isAdmin) {
        // 管理者による登録（管理者ダッシュボードから）
        const response = await adminApi.createUser({
          email,
          password,
          name,
          role: 'EMPLOYEE', // デフォルトは一般ユーザー
        });
        
        if (response.status === 'success') {
          return true;
        }
      } else {
        // 一般ユーザーによる登録（登録ページから）
        const response = await authApi.register(email, password, name);
        
        if (response.status === 'success') {
          // ユーザー情報とトークンを保存
          login(response.data.user, null, response.data.token);
          // ダッシュボードにリダイレクト
          navigate('/dashboard');
          return true;
        }
      }
      
      return false;
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
        // ユーザーの企業情報を取得（企業IDがある場合）
        let company: Company | null = null;
        if (response.data.user.companyId) {
          try {
            const companyResponse = await companyApi.getCompany(response.data.user.companyId);
            if (companyResponse.status === 'success') {
              company = companyResponse.data;
            }
          } catch (companyError) {
            console.error('企業情報の取得に失敗しました:', companyError);
          }
        }
        
        // ユーザー情報、企業情報、トークンを保存
        login(response.data.user, company, response.data.token);
        
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
        
        // ユーザーの企業情報を取得（企業IDがある場合）
        if (response.data.companyId) {
          try {
            const companyResponse = await companyApi.getCompany(response.data.companyId);
            if (companyResponse.status === 'success') {
              useAuthStore.getState().setCompany(companyResponse.data);
            }
          } catch (companyError) {
            console.error('企業情報の取得に失敗しました:', companyError);
          }
        }
        
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

  // プロフィール更新
  const handleProfileUpdate = async (name: string, email: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await authApi.updateProfile({ name, email });
      if (response.status === 'success') {
        // ユーザー情報を更新
        setUser(response.data);
        return true;
      }
      return false;
    } catch (error: any) {
      // エラーメッセージの設定
      const errorMessage =
        error.response?.data?.message || 'プロフィール更新中にエラーが発生しました';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 企業情報更新
  const handleCompanyUpdate = async (companyId: string | null) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // ユーザーIDを取得
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        setError('ユーザー情報が見つかりません');
        return false;
      }
      
      // 管理者APIを使用してユーザーの企業を更新
      // companyIdがnullの場合はundefinedに変換（APIの型に合わせる）
      const response = await adminApi.updateUser(userId, { 
        companyId: companyId === null ? undefined : companyId 
      });
      if (response.status === 'success') {
        // ユーザー情報を更新
        setUser(response.data);
        
        // 企業情報を取得して更新
        if (companyId) {
          try {
            const companyResponse = await companyApi.getCompany(companyId);
            if (companyResponse.status === 'success') {
              useAuthStore.getState().setCompany(companyResponse.data);
            }
          } catch (companyError) {
            console.error('企業情報の取得に失敗しました:', companyError);
          }
        } else {
          // 企業が選択されていない場合は企業情報をクリア
          useAuthStore.getState().setCompany(null);
        }
        
        return true;
      }
      return false;
    } catch (error: any) {
      // エラーメッセージの設定
      const errorMessage =
        error.response?.data?.message || '企業情報更新中にエラーが発生しました';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // パスワード変更
  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await authApi.changePassword({ currentPassword, newPassword });
      if (response.status === 'success') {
        return true;
      }
      return false;
    } catch (error: any) {
      // エラーメッセージの設定
      const errorMessage =
        error.response?.data?.message || 'パスワード変更中にエラーが発生しました';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    setError,
    handleRegister,
    handleLogin,
    handleLogout,
    fetchCurrentUser,
    handleProfileUpdate,
    handlePasswordChange,
    handleCompanyUpdate,
  };
};
