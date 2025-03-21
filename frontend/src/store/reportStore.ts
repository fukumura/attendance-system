import { create } from 'zustand';
import { reportApi } from '../services/api';
import { AttendanceRecord } from './attendanceStore';
import { LeaveRequest } from './leaveStore';

// ユーザーレポートの型定義
export interface UserReport {
  user: {
    id: string;
    name: string;
    email: string;
  };
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  attendance: {
    totalWorkingDays: number;
    totalWorkingHours: number;
    averageWorkingHours: number;
    dailyWorkingHours: { date: string; hours: number }[];
    records: AttendanceRecord[];
  };
  leave: {
    totalLeaveDays: number;
    leaveCountByType: {
      PAID: number;
      UNPAID: number;
      SICK: number;
      OTHER: number;
    };
    requests: LeaveRequest[];
  };
}

// 部門レポートの型定義
export interface DepartmentReport {
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  departmentSummary: {
    totalUsers: number;
    totalWorkingDays: number;
    totalWorkingHours: number;
    averageWorkingHoursPerUser: number;
    totalLeaveDays: number;
    leaveCountByType: {
      PAID: number;
      UNPAID: number;
      SICK: number;
      OTHER: number;
    };
  };
  userReports: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    attendance: {
      totalWorkingDays: number;
      totalWorkingHours: number;
      records: AttendanceRecord[];
    };
    leave: {
      totalLeaveDays: number;
      leaveCountByType: {
        PAID: number;
        UNPAID: number;
        SICK: number;
        OTHER: number;
      };
      requests: LeaveRequest[];
    };
  }[];
}

// 会社コンプライアンスレポートの型定義
export interface CompanyComplianceReport {
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  companySummary: {
    totalUsers: number;
    activeUsers: number;
  };
  complianceReport: {
    overtimeStatus: {
      totalOvertimeHours: number;
      averageOvertimeHours: number;
      excessiveOvertimeCount: number;
      excessiveOvertimeRate: number;
      topOvertimeUsers: {
        userId: string;
        name: string;
        email: string;
        role: string;
        overtimeHours: number;
        excessDays: number;
      }[];
    };
    breakTimeStatus: {
      totalWorkingDays: number;
      insufficientBreakDays: number;
      breakComplianceRate: number;
      insufficientBreakUsers: {
        userId: string;
        name: string;
        email: string;
        role: string;
        workingDays: number;
        insufficientBreakDays: number;
        breakComplianceRate: number;
      }[];
    };
    holidayWorkStatus: {
      totalHolidayWorkDays: number;
      totalHolidayWorkHours: number;
      holidayWorkUsers: number;
      holidayWorkRate: number;
      topHolidayWorkUsers: {
        userId: string;
        name: string;
        email: string;
        role: string;
        holidayWorkDays: number;
        holidayWorkHours: number;
      }[];
    };
    nightWorkStatus: {
      totalNightWorkDays: number;
      totalNightWorkHours: number;
      nightWorkUsers: number;
      nightWorkRate: number;
      topNightWorkUsers: {
        userId: string;
        name: string;
        email: string;
        role: string;
        nightWorkDays: number;
        nightWorkHours: number;
      }[];
    };
    paidLeaveStatus: {
      totalPaidLeaveDays: number;
      averagePaidLeaveDays: number;
      targetAchievedUsers: number;
      targetAchievedRate: number;
      overallPaidLeaveRate: number;
      lowPaidLeaveUsers: {
        userId: string;
        name: string;
        email: string;
        role: string;
        paidLeaveDays: number;
        paidLeaveTarget: number;
        remainingDays: number;
        paidLeaveRate: number;
      }[];
    };
  };
}

// レポートストアの型定義
interface ReportState {
  userReport: UserReport | null;
  departmentReport: DepartmentReport | null;
  companyComplianceReport: CompanyComplianceReport | null;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  fetchUserReport: (userId: string, params: { year: number; month: number }) => Promise<void>;
  fetchDepartmentReport: (params: { year: number; month: number }) => Promise<void>;
  fetchCompanyComplianceReport: (params: { year: number; month: number }) => Promise<void>;
  exportReport: (params: { userId: string; year: number; month: number; type: 'attendance' | 'leave' }) => Promise<void>;
  
  // ユーティリティ
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  userReport: null,
  departmentReport: null,
  companyComplianceReport: null,
  isLoading: false,
  error: null,
  
  // ユーザー別レポート取得
  fetchUserReport: async (userId, params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reportApi.getUserReport(userId, params);
      if (response.status === 'success') {
        set({ userReport: response.data });
      } else {
        set({ error: response.message || 'レポートの取得に失敗しました' });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'レポートの取得中にエラーが発生しました' 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 部門別レポート取得（管理者のみ）
  fetchDepartmentReport: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reportApi.getDepartmentReport(params);
      if (response.status === 'success') {
        set({ departmentReport: response.data });
      } else {
        set({ error: response.message || '部門レポートの取得に失敗しました' });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '部門レポートの取得中にエラーが発生しました' 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 会社全体のコンプライアンスレポート取得（管理者のみ）
  fetchCompanyComplianceReport: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reportApi.getCompanyComplianceReport(params);
      if (response.status === 'success') {
        set({ companyComplianceReport: response.data });
      } else {
        set({ error: response.message || '会社コンプライアンスレポートの取得に失敗しました' });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || '会社コンプライアンスレポートの取得中にエラーが発生しました' 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // レポートエクスポート
  exportReport: async (params) => {
    set({ isLoading: true, error: null });
    try {
      await reportApi.exportReport(params);
      // エクスポートは成功するとファイルダウンロードが始まるため、特に状態更新は不要
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'レポートのエクスポート中にエラーが発生しました' 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // ユーティリティメソッド
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ 
    userReport: null,
    departmentReport: null,
    companyComplianceReport: null,
    error: null
  }),
}));
