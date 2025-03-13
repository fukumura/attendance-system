import { create } from 'zustand';
import { leaveApi } from '../services/api';

// 休暇種別の型定義
export type LeaveType = 'PAID' | 'UNPAID' | 'SICK' | 'OTHER';

// 休暇ステータスの型定義
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// 休暇申請の型定義
export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// 休暇申請一覧レスポンスの型定義
export interface LeaveRequestsResponse {
  leaves: LeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 休暇ストアの型定義
interface LeaveState {
  requests: LeaveRequest[];
  currentRequest: LeaveRequest | null;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  fetchRequests: (params?: { status?: LeaveStatus; startDate?: string; endDate?: string; page?: number; limit?: number }) => Promise<void>;
  fetchRequest: (id: string) => Promise<void>;
  createRequest: (data: { startDate: string; endDate: string; leaveType: LeaveType; reason: string }) => Promise<boolean>;
  updateRequest: (id: string, data: { startDate?: string; endDate?: string; leaveType?: LeaveType; reason?: string }) => Promise<boolean>;
  updateStatus: (id: string, data: { status: 'APPROVED' | 'REJECTED'; comment?: string }) => Promise<boolean>;
  
  // ユーティリティ
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  requests: [],
  currentRequest: null,
  isLoading: false,
  error: null,
  
  // 休暇申請一覧を取得
  fetchRequests: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveApi.getLeaves(params);
      if (response.status === 'success') {
        set({ requests: response.data.leaves });
      } else {
        set({ error: response.message || '休暇申請の取得に失敗しました' });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '休暇申請の取得中にエラーが発生しました' 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 休暇申請詳細を取得
  fetchRequest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveApi.getLeave(id);
      if (response.status === 'success') {
        set({ currentRequest: response.data });
      } else {
        set({ error: response.message || '休暇申請の取得に失敗しました' });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '休暇申請の取得中にエラーが発生しました' 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 休暇申請を作成
  createRequest: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveApi.createLeave(data);
      if (response.status === 'success') {
        // 休暇申請一覧を更新
        set(state => ({
          requests: [response.data, ...state.requests],
          currentRequest: response.data
        }));
        return true;
      } else {
        set({ error: response.message || '休暇申請の作成に失敗しました' });
        return false;
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '休暇申請の作成中にエラーが発生しました' 
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 休暇申請を更新
  updateRequest: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveApi.updateLeave(id, data);
      if (response.status === 'success') {
        // 休暇申請一覧と現在の申請を更新
        set(state => ({
          requests: state.requests.map(req => req.id === id ? response.data : req),
          currentRequest: state.currentRequest?.id === id ? response.data : state.currentRequest
        }));
        return true;
      } else {
        set({ error: response.message || '休暇申請の更新に失敗しました' });
        return false;
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '休暇申請の更新中にエラーが発生しました' 
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 休暇申請のステータスを更新（管理者のみ）
  updateStatus: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveApi.updateStatus(id, data);
      if (response.status === 'success') {
        // 休暇申請一覧と現在の申請を更新
        set(state => ({
          requests: state.requests.map(req => req.id === id ? response.data : req),
          currentRequest: state.currentRequest?.id === id ? response.data : state.currentRequest
        }));
        return true;
      } else {
        set({ error: response.message || '休暇申請ステータスの更新に失敗しました' });
        return false;
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '休暇申請ステータスの更新中にエラーが発生しました' 
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // ユーティリティメソッド
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ 
    requests: [],
    currentRequest: null,
    error: null
  }),
}));
