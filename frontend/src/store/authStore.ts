import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 企業の型定義
export interface Company {
  id: string;
  publicId: string;
  name: string;
  logoUrl?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// 認証ユーザーの型定義
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
  companyId?: string | null;
}

// 認証状態の型定義
interface AuthState {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  setUser: (user: User | null) => void;
  setCompany: (company: Company | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // ユーティリティメソッド
  login: (user: User, company: Company | null, token: string) => void;
  logout: () => void;
  switchCompany: (company: Company) => void;
  isSuperAdmin: () => boolean;
}

// 認証ストアの作成（永続化）
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // アクション
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      setCompany: (company) => set({ company }),
      setToken: (token) => set({ token }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // ユーティリティメソッド
      login: (user, company, token) => set({ 
        user, 
        company,
        token, 
        isAuthenticated: true,
        error: null 
      }),
      logout: () => set({ 
        user: null, 
        company: null,
        token: null, 
        isAuthenticated: false 
      }),
      switchCompany: (company) => set({
        company
      }),
      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',
    }),
    {
      name: 'auth-storage', // ローカルストレージのキー
    }
  )
);
