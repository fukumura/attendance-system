import axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore, User } from '../store/authStore';
import { Task, TaskFilters, ApiResponse, TasksResponse } from '../store/taskStore';

// 認証レスポンスの型定義
export interface AuthResponse {
  user: User;
  token: string;
}

// API基本設定
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// APIクライアントの作成
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター - 認証トークンの追加
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター - エラーハンドリング
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 認証エラー（401）の場合はログアウト
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// 認証API
export const authApi = {
  // ユーザー登録
  register: async (email: string, password: string, name: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },
  
  // ログイン
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },
  
  // 現在のユーザー情報取得
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// タスクAPI
export const taskApi = {
  // タスク一覧取得
  getTasks: async (filters?: TaskFilters): Promise<ApiResponse<TasksResponse>> => {
    const response = await api.get('/api/tasks', { params: filters });
    return response.data;
  },
  
  // タスク詳細取得
  getTask: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
  },
  
  // タスク作成
  createTask: async (data: Partial<Task>): Promise<ApiResponse<Task>> => {
    const response = await api.post('/api/tasks', data);
    return response.data;
  },
  
  // タスク更新
  updateTask: async (id: string, data: Partial<Task>): Promise<ApiResponse<Task>> => {
    const response = await api.put(`/api/tasks/${id}`, data);
    return response.data;
  },
  
  // タスク削除
  deleteTask: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await api.delete(`/api/tasks/${id}`);
    return response.data;
  },
  
  // タスク完了状態切り替え
  toggleTaskCompletion: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await api.patch(`/api/tasks/${id}/toggle`);
    return response.data;
  },
};

export default api;
