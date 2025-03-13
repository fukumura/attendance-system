import { create } from 'zustand';
import { attendanceApi } from '../services/api';

// 勤怠記録の型定義
export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  clockInTime: string;
  clockOutTime: string | null;
  notes?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// 勤怠状態の型定義
export interface AttendanceStatus {
  isClockedIn: boolean;
  isClockedOut: boolean;
  record: AttendanceRecord | null;
}

// 勤務時間サマリーの型定義
export interface AttendanceSummary {
  totalWorkingHours: number;
  totalWorkingDays: number;
  averageWorkingHours: number;
  dailyWorkingHours: { date: string; hours: number }[];
}

// 勤怠ストアの型定義
interface AttendanceState {
  todayStatus: AttendanceStatus | null;
  records: AttendanceRecord[];
  summary: AttendanceSummary | null;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  fetchTodayStatus: () => Promise<void>;
  clockIn: (data: { location?: string; notes?: string }) => Promise<boolean>;
  clockOut: (data: { location?: string; notes?: string }) => Promise<boolean>;
  fetchRecords: (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) => Promise<void>;
  fetchSummary: (params: { startDate: string; endDate: string }) => Promise<void>;
  
  // ユーティリティ
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  todayStatus: null,
  records: [],
  summary: null,
  isLoading: false,
  error: null,
  
  // 今日の勤怠状態を取得
  fetchTodayStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceApi.getTodayStatus();
      if (response.status === 'success') {
        set({ todayStatus: response.data });
      } else {
        set({ error: response.message || '勤怠状態の取得に失敗しました' });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '勤怠状態の取得中にエラーが発生しました' 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 出勤打刻
  clockIn: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceApi.clockIn(data);
      if (response.status === 'success') {
        // 勤怠状態を更新
        set({ 
          todayStatus: {
            isClockedIn: true,
            isClockedOut: false,
            record: response.data
          }
        });
        return true;
      } else {
        set({ error: response.message || '出勤打刻に失敗しました' });
        return false;
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '出勤打刻中にエラーが発生しました' 
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 退勤打刻
  clockOut: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceApi.clockOut(data);
      if (response.status === 'success') {
        // 勤怠状態を更新
        set({ 
          todayStatus: {
            isClockedIn: true,
            isClockedOut: true,
            record: response.data
          }
        });
        return true;
      } else {
        set({ error: response.message || '退勤打刻に失敗しました' });
        return false;
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '退勤打刻中にエラーが発生しました' 
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 勤怠記録一覧を取得
  fetchRecords: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceApi.getRecords(params);
      if (response.status === 'success') {
        set({ records: response.data.records });
      } else {
        set({ error: response.message || '勤怠記録の取得に失敗しました' });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '勤怠記録の取得中にエラーが発生しました' 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 勤務時間サマリーを取得
  fetchSummary: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceApi.getSummary(params);
      if (response.status === 'success') {
        set({ summary: response.data });
      } else {
        set({ error: response.message || '勤務時間サマリーの取得に失敗しました' });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '勤務時間サマリーの取得中にエラーが発生しました' 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // ユーティリティメソッド
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ 
    todayStatus: null,
    records: [],
    summary: null,
    error: null
  }),
}));
