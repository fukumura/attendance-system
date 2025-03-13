import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 認証ユーザーの型定義
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

// 認証状態の型定義
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // ユーティリティメソッド
  login: (user: User, token: string) => void;
  logout: () => void;
}

// 認証ストアの作成（永続化）
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // アクション
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      setToken: (token) => set({ token }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // ユーティリティメソッド
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true,
        error: null 
      }),
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage', // ローカルストレージのキー
    }
  )
);
