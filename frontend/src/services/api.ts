import axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore, User } from '../store/authStore';
import { Task, TaskFilters, ApiResponse, TasksResponse } from '../store/taskStore';
import { AttendanceRecord, AttendanceStatus, AttendanceSummary } from '../store/attendanceStore';
import { LeaveRequest, LeaveRequestsResponse, LeaveType, LeaveStatus } from '../store/leaveStore';
import { UserReport, DepartmentReport } from '../store/reportStore';

// 認証レスポンスの型定義
export interface AuthResponse {
  user: User;
  token: string;
}

// 管理者APIのユーザー型定義（createdAtとupdatedAtを含む）
export interface AdminUser extends User {
  createdAt: string;
  updatedAt: string;
}

// ユーザー管理レスポンスの型定義
export interface UsersResponse {
  status: string;
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 勤怠記録レスポンスの型定義
export interface AttendanceRecordsResponse {
  records: AttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API基本設定
// 開発環境ではプロキシを使用し、本番環境では環境変数を使用
const isDevelopment = import.meta.env.DEV;
// 本番環境ではAPIリクエストはVercelのリライトルールを通じて転送されるため、相対パスを使用
const API_URL = isDevelopment ? '' : '';

// APIクライアントの作成
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
  // withCredentials オプションを削除して認証情報の送信を無効化
});

// リクエストインターセプター - 認証トークンと企業IDの追加
api.interceptors.request.use(
  (config) => {
    const { token, company, user } = useAuthStore.getState();
    
    // 認証トークンの追加
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // スーパー管理者が企業を選択している場合、または通常ユーザーの場合は企業IDを追加
    if (company?.publicId) {
      config.headers['X-Company-ID'] = company.publicId;
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
  
  // プロフィール更新
  updateProfile: async (data: { name: string; email: string }): Promise<ApiResponse<User>> => {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },
  
  // パスワード変更
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.put('/api/auth/password', data);
    return response.data;
  },
};

// 勤怠API
export const attendanceApi = {
  // 今日の勤怠状態取得
  getTodayStatus: async (): Promise<ApiResponse<AttendanceStatus>> => {
    const response = await api.get('/api/attendance/today');
    return response.data;
  },
  
  // 出勤打刻
  clockIn: async (data: { location?: string; notes?: string }): Promise<ApiResponse<AttendanceRecord>> => {
    const response = await api.post('/api/attendance/clock-in', data);
    return response.data;
  },
  
  // 退勤打刻
  clockOut: async (data: { location?: string; notes?: string }): Promise<ApiResponse<AttendanceRecord>> => {
    const response = await api.post('/api/attendance/clock-out', data);
    return response.data;
  },
  
  // 勤怠記録一覧取得
  getRecords: async (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<ApiResponse<AttendanceRecordsResponse>> => {
    const response = await api.get('/api/attendance/records', { params });
    return response.data;
  },
  
  // 勤務時間サマリー取得
  getSummary: async (params: { startDate: string; endDate: string }): Promise<ApiResponse<AttendanceSummary>> => {
    const response = await api.get('/api/attendance/summary', { params });
    return response.data;
  },
};

// 休暇API
export const leaveApi = {
  // 休暇申請一覧取得
  getLeaves: async (params?: { status?: LeaveStatus; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<ApiResponse<LeaveRequestsResponse>> => {
    const response = await api.get('/api/leave', { params });
    return response.data;
  },
  
  // 休暇申請詳細取得
  getLeave: async (id: string): Promise<ApiResponse<LeaveRequest>> => {
    const response = await api.get(`/api/leave/${id}`);
    return response.data;
  },
  
  // 休暇申請作成
  createLeave: async (data: { startDate: string; endDate: string; leaveType: LeaveType; reason: string }): Promise<ApiResponse<LeaveRequest>> => {
    const response = await api.post('/api/leave', data);
    return response.data;
  },
  
  // 休暇申請更新
  updateLeave: async (id: string, data: { startDate?: string; endDate?: string; leaveType?: LeaveType; reason?: string }): Promise<ApiResponse<LeaveRequest>> => {
    const response = await api.put(`/api/leave/${id}`, data);
    return response.data;
  },
  
  // 休暇申請ステータス更新（管理者のみ）
  updateStatus: async (id: string, data: { status: 'APPROVED' | 'REJECTED'; comment?: string }): Promise<ApiResponse<LeaveRequest>> => {
    const response = await api.put(`/api/leave/${id}/status`, data);
    return response.data;
  },
};

// レポートAPI
export const reportApi = {
  // ユーザー別レポート取得
  getUserReport: async (userId: string, params: { year: number; month: number }): Promise<ApiResponse<UserReport>> => {
    const response = await api.get(`/api/reports/user/${userId}`, { params });
    return response.data;
  },
  
  // 部門別レポート取得（管理者のみ）
  getDepartmentReport: async (params: { year: number; month: number }): Promise<ApiResponse<DepartmentReport>> => {
    const response = await api.get('/api/reports/department', { params });
    return response.data;
  },
  
  // レポートエクスポート
  exportReport: async (params: { userId: string; year: number; month: number; type: 'attendance' | 'leave' }): Promise<void> => {
    // ファイルダウンロードのためにwindow.openを使用
    const queryParams = new URLSearchParams({
      userId: params.userId,
      year: params.year.toString(),
      month: params.month.toString(),
      type: params.type
    }).toString();
    
    // 開発環境ではプロキシを使用し、本番環境では環境変数を使用
    const baseUrl = isDevelopment ? window.location.origin : API_URL;
    window.open(`${baseUrl}/api/reports/export?${queryParams}`);
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

// 管理者API
export const adminApi = {
  // ユーザー一覧取得
  getUsers: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<UsersResponse>> => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },
  
  // ユーザー詳細取得
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data;
  },
  
  // ユーザー作成
  createUser: async (data: { email: string; password: string; name: string; role?: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN'; companyId?: string }): Promise<ApiResponse<User>> => {
    const response = await api.post('/api/admin/users', data);
    return response.data;
  },
  
  // ユーザー更新
  updateUser: async (id: string, data: { email?: string; password?: string; name?: string; role?: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN'; companyId?: string }): Promise<ApiResponse<User>> => {
    const response = await api.put(`/api/admin/users/${id}`, data);
    return response.data;
  },
  
  // ユーザー削除
  deleteUser: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  },
  
  // スーパー管理者作成（スーパー管理者のみ）
  createSuperAdmin: async (data: { email: string; password: string; name: string }): Promise<ApiResponse<User>> => {
    const response = await api.post('/api/admin/super-admins', data);
    return response.data;
  },
};

export default api;
