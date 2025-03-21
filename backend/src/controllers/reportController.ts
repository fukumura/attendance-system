import { Request, Response } from 'express';
import { prisma } from '../app';

// 日付ユーティリティ関数
const getStartOfMonth = (date: Date): Date => {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
};

const getEndOfMonth = (date: Date): Date => {
  const endOfMonth = new Date(date);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
};

// 曜日判定（0: 日曜日, 6: 土曜日）
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// CSVデータ生成関数
const generateAttendanceCSV = (records: any[]): string => {
  // ヘッダー行
  const headers = [
    '日付',
    '出勤時間',
    '退勤時間',
    '勤務時間（時間）',
    '備考',
  ].join(',');
  
  // データ行
  const rows = records.map((record) => {
    const date = new Date(record.date).toISOString().split('T')[0];
    const clockInTime = record.clockInTime
      ? new Date(record.clockInTime).toLocaleTimeString('ja-JP')
      : '';
    const clockOutTime = record.clockOutTime
      ? new Date(record.clockOutTime).toLocaleTimeString('ja-JP')
      : '';
    
    let workingHours = '';
    if (record.clockInTime && record.clockOutTime) {
      const clockIn = new Date(record.clockInTime);
      const clockOut = new Date(record.clockOutTime);
      const diffMs = clockOut.getTime() - clockIn.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      workingHours = diffHours.toFixed(2);
    }
    
    const notes = record.notes ? `"${record.notes}"` : '';
    
    return [date, clockInTime, clockOutTime, workingHours, notes].join(',');
  });
  
  return [headers, ...rows].join('\n');
};

const generateLeaveCSV = (leaves: any[]): string => {
  // ヘッダー行
  const headers = [
    '開始日',
    '終了日',
    '休暇種別',
    '理由',
    'ステータス',
    'コメント',
  ].join(',');
  
  // データ行
  const rows = leaves.map((leave) => {
    const startDate = new Date(leave.startDate).toISOString().split('T')[0];
    const endDate = new Date(leave.endDate).toISOString().split('T')[0];
    const leaveType = leave.leaveType;
    const reason = `"${leave.reason}"`;
    const status = leave.status;
    const comment = leave.comment ? `"${leave.comment}"` : '';
    
    return [startDate, endDate, leaveType, reason, status, comment].join(',');
  });
  
  return [headers, ...rows].join('\n');
};

export const reportController = {
  // ユーザー別レポート取得
  getUserReport: async (req: Request, res: Response) => {
    try {
      // ユーザーIDの取得
      const currentUserId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';
      const companyId = req.user?.companyId;
      
      if (!currentUserId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // レポート対象のユーザーID
      const { userId } = req.params;
      
      // 管理者でない場合は自分のレポートのみ取得可能
      if (!isAdmin && userId !== currentUserId) {
        return res.status(403).json({
          status: 'error',
          message: '他のユーザーのレポートを取得する権限がありません',
        });
      }
      
      // クエリパラメータの取得
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({
          status: 'error',
          message: '年と月は必須です',
        });
      }
      
      // 対象月の開始日と終了日
      const targetDate = new Date(
        parseInt(year as string),
        parseInt(month as string) - 1,
        1
      );
      const startOfMonth = getStartOfMonth(targetDate);
      const endOfMonth = getEndOfMonth(targetDate);
      
      // ユーザー情報の取得（管理者の場合は同じ会社のユーザーのみ）
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
          ...(isAdmin && companyId ? { companyId } : {}), // 管理者の場合は同じ会社のユーザーのみ
        },
        select: {
          id: true,
          name: true,
          email: true,
          companyId: true,
        },
      });
      
      if (!user || (isAdmin && user.companyId !== companyId)) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません、または権限がありません',
        });
      }
      
      // 勤怠記録の取得
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          userId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          user: {
            companyId: user.companyId, // 同じ会社のユーザーの記録のみ
          },
        },
        orderBy: {
          date: 'asc',
        },
      });
      
      // 休暇申請の取得
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          userId,
          OR: [
            {
              startDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            {
              endDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          ],
          status: 'APPROVED', // 承認済みの休暇のみ
          user: {
            companyId: user.companyId, // 同じ会社のユーザーの記録のみ
          },
        },
        orderBy: {
          startDate: 'asc',
        },
      });
      
      // 勤務時間の計算
      let totalWorkingMinutes = 0;
      const dailyWorkingHours: { date: string; hours: number }[] = [];
      
      attendanceRecords.forEach((record: any) => {
        if (record.clockInTime && record.clockOutTime) {
          const clockInTime = new Date(record.clockInTime);
          const clockOutTime = new Date(record.clockOutTime);
          const workingMinutes =
            (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60);
          
          totalWorkingMinutes += workingMinutes;
          
          const dateStr = record.date.toISOString().split('T')[0];
          const hours = workingMinutes / 60;
          
          dailyWorkingHours.push({
            date: dateStr,
            hours,
          });
        }
      });
      
      // 休暇日数の計算
      const leaveCountByType: Record<string, number> = {
        PAID: 0,
        UNPAID: 0,
        SICK: 0,
        OTHER: 0,
      };
      
      leaveRequests.forEach((leave: any) => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        leaveCountByType[leave.leaveType] += diffDays;
      });
      
      // レポートデータの作成
      const report = {
        user,
        period: {
          year: parseInt(year as string),
          month: parseInt(month as string),
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0],
        },
        attendance: {
          totalWorkingDays: attendanceRecords.length,
          totalWorkingHours: totalWorkingMinutes / 60,
          averageWorkingHours:
            attendanceRecords.length > 0
              ? totalWorkingMinutes / 60 / attendanceRecords.length
              : 0,
          dailyWorkingHours,
          records: attendanceRecords,
        },
        leave: {
          totalLeaveDays: Object.values(leaveCountByType).reduce(
            (sum, count) => sum + count,
            0
          ),
          leaveCountByType,
          requests: leaveRequests,
        },
      };
      
      return res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      console.error('Get user report error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'レポートの取得中にエラーが発生しました',
      });
    }
  },
  
  // 部門別レポート取得（管理者のみ）
  getDepartmentReport: async (req: Request, res: Response) => {
    try {
      // ユーザーIDの取得
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // 管理者権限チェック
      if (!isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: '管理者権限が必要です',
        });
      }
      
      // 企業IDの取得
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: '企業IDが必要です',
        });
      }
      
      // クエリパラメータの取得
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({
          status: 'error',
          message: '年と月は必須です',
        });
      }
      
      // 対象月の開始日と終了日
      const targetDate = new Date(
        parseInt(year as string),
        parseInt(month as string) - 1,
        1
      );
      const startOfMonth = getStartOfMonth(targetDate);
      const endOfMonth = getEndOfMonth(targetDate);
      
      // 会社の全ユーザーの取得
      const users = await prisma.user.findMany({
        where: {
          companyId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      
      // 勤怠記録の取得
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          user: {
            companyId,
          },
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      // 休暇申請の取得
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          user: {
            companyId,
          },
          OR: [
            {
              startDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            {
              endDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          ],
          status: 'APPROVED', // 承認済みの休暇のみ
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      // ユーザー別の勤怠データ集計
      const userReports: Record<string, any> = {};
      
      users.forEach((user: any) => {
        userReports[user.id] = {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          attendance: {
            totalWorkingDays: 0,
            totalWorkingHours: 0,
            records: [],
          },
          leave: {
            totalLeaveDays: 0,
            leaveCountByType: {
              PAID: 0,
              UNPAID: 0,
              SICK: 0,
              OTHER: 0,
            },
            requests: [],
          },
        };
      });
      
      // 勤怠記録の集計
      attendanceRecords.forEach((record: any) => {
        const userId = record.userId;
        
        if (userReports[userId]) {
          userReports[userId].attendance.records.push(record);
          userReports[userId].attendance.totalWorkingDays++;
          
          if (record.clockInTime && record.clockOutTime) {
            const clockInTime = new Date(record.clockInTime);
            const clockOutTime = new Date(record.clockOutTime);
            const workingHours =
              (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
            
            userReports[userId].attendance.totalWorkingHours += workingHours;
          }
        }
      });
      
      // 休暇申請の集計
      leaveRequests.forEach((leave: any) => {
        const userId = leave.userId;
        
        if (userReports[userId]) {
          userReports[userId].leave.requests.push(leave);
          
          const startDate = new Date(leave.startDate);
          const endDate = new Date(leave.endDate);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          userReports[userId].leave.totalLeaveDays += diffDays;
          userReports[userId].leave.leaveCountByType[leave.leaveType] += diffDays;
        }
      });
      
      // 部門全体の集計
      const departmentSummary = {
        totalUsers: users.length,
        totalWorkingDays: Object.values(userReports).reduce(
          (sum: number, report: any) => sum + report.attendance.totalWorkingDays,
          0
        ),
        totalWorkingHours: Object.values(userReports).reduce(
          (sum: number, report: any) => sum + report.attendance.totalWorkingHours,
          0
        ),
        averageWorkingHoursPerUser:
          users.length > 0
            ? Object.values(userReports).reduce(
                (sum: number, report: any) => sum + report.attendance.totalWorkingHours,
                0
              ) / users.length
            : 0,
        totalLeaveDays: Object.values(userReports).reduce(
          (sum: number, report: any) => sum + report.leave.totalLeaveDays,
          0
        ),
        leaveCountByType: {
          PAID: Object.values(userReports).reduce(
            (sum: number, report: any) => sum + report.leave.leaveCountByType.PAID,
            0
          ),
          UNPAID: Object.values(userReports).reduce(
            (sum: number, report: any) => sum + report.leave.leaveCountByType.UNPAID,
            0
          ),
          SICK: Object.values(userReports).reduce(
            (sum: number, report: any) => sum + report.leave.leaveCountByType.SICK,
            0
          ),
          OTHER: Object.values(userReports).reduce(
            (sum: number, report: any) => sum + report.leave.leaveCountByType.OTHER,
            0
          ),
        },
      };
      
      // レポートデータの作成
      const report = {
        period: {
          year: parseInt(year as string),
          month: parseInt(month as string),
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0],
        },
        departmentSummary,
        userReports: Object.values(userReports),
      };
      
      return res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      console.error('Get department report error:', error);
      return res.status(500).json({
        status: 'error',
        message: '部門レポートの取得中にエラーが発生しました',
      });
    }
  },
  
  // 会社全体のコンプライアンスレポート取得（管理者のみ）
  getCompanyComplianceReport: async (req: Request, res: Response) => {
    try {
      // ユーザーIDの取得
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // 管理者権限チェック
      if (!isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: '管理者権限が必要です',
        });
      }
      
      // 企業IDの取得
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: '企業IDが必要です',
        });
      }
      
      // クエリパラメータの取得（年月）
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({
          status: 'error',
          message: '年と月は必須です',
        });
      }
      
      // 対象月の開始日と終了日
      const targetDate = new Date(
        parseInt(year as string),
        parseInt(month as string) - 1,
        1
      );
      const startOfMonth = getStartOfMonth(targetDate);
      const endOfMonth = getEndOfMonth(targetDate);
      
      // 会社の全ユーザー取得
      const users = await prisma.user.findMany({
        where: {
          companyId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      
      // 勤怠記録の取得
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          user: {
            companyId,
          },
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      // 休暇申請の取得
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          user: {
            companyId,
          },
          OR: [
            {
              startDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            {
              endDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          ],
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      // ユーザー別の勤怠データと休暇データを集計
      const userStats: Record<string, any> = {};
      
      // 各ユーザーの統計情報を初期化
      users.forEach(user => {
        userStats[user.id] = {
          id: user.id,
          name: user.name,
          workingDays: 0,
          totalWorkingHours: 0,
          overtimeHours: 0,
          excessDays: 0, // 法定労働時間超過日数
          holidayWorkDays: 0,
          holidayWorkHours: 0,
          nightWorkDays: 0,
          nightWorkHours: 0,
          insufficientBreakDays: 0,
          paidLeaveDays: 0,
          attendanceRecords: [],
          leaveRequests: [],
        };
      });
      
      // 勤怠記録の集計
      attendanceRecords.forEach(record => {
        const userId = record.userId;
        const user = userStats[userId];
        
        if (!user) return;
        
        user.attendanceRecords.push(record);
        
        // 日付情報
        const recordDate = new Date(record.date);
        const isHoliday = isWeekend(recordDate); // 土日を休日とみなす
        
        // 勤務時間の計算
        if (record.clockInTime && record.clockOutTime) {
          const clockInTime = new Date(record.clockInTime);
          const clockOutTime = new Date(record.clockOutTime);
          const workingMs = clockOutTime.getTime() - clockInTime.getTime();
          const workingHours = workingMs / (1000 * 60 * 60);
          
          user.workingDays++;
          user.totalWorkingHours += workingHours;
          
          // 残業時間の計算（8時間を超える部分）
          const standardHours = 8;
          const overtimeHours = Math.max(0, workingHours - standardHours);
          if (overtimeHours > 0) {
            user.overtimeHours += overtimeHours;
            
            // 法定時間外労働（1日8時間超）
            if (overtimeHours > 0) {
              user.excessDays++;
            }
          }
          
          // 休日労働の集計
          if (isHoliday) {
            user.holidayWorkDays++;
            user.holidayWorkHours += workingHours;
          }
          
          // 深夜労働の集計（22時〜5時）
          let nightWorkHours = 0;
          
          // 深夜帯の開始・終了時間
          const nightStart = new Date(clockInTime);
          nightStart.setHours(22, 0, 0, 0);
          
          const nightEnd = new Date(clockInTime);
          nightEnd.setHours(5, 0, 0, 0);
          if (nightEnd > clockInTime) {
            // 翌日の5時に設定
            nightEnd.setDate(nightEnd.getDate() + 1);
          }
          
          // 深夜勤務時間の計算
          if (
            (clockInTime <= nightStart && clockOutTime > nightStart) || // 22時をまたぐ勤務
            (clockInTime >= nightStart || clockOutTime <= nightEnd) || // 22時以降または5時以前に勤務
            (clockInTime <= nightEnd && clockInTime.getHours() < 5) // 早朝勤務
          ) {
            // 深夜勤務あり
            user.nightWorkDays++;
            
            // 深夜時間帯の勤務時間を計算
            const nightWorkStart = Math.max(clockInTime.getTime(), nightStart.getTime());
            const nextDayNightEnd = new Date(nightEnd);
            nextDayNightEnd.setDate(nextDayNightEnd.getDate() + 1);
            const nightWorkEnd = Math.min(clockOutTime.getTime(), nextDayNightEnd.getTime());
            
            if (nightWorkEnd > nightWorkStart) {
              nightWorkHours = (nightWorkEnd - nightWorkStart) / (1000 * 60 * 60);
              user.nightWorkHours += nightWorkHours;
            }
          }
          
          // 休憩時間不足の検出（8時間超の勤務で1時間未満の休憩）
          if (workingHours > 8) {
            // 休憩時間の情報がない場合や、休憩時間が1時間未満の場合
            if (record.notes && record.notes.includes('休憩時間短め')) {
              user.insufficientBreakDays++;
            }
          }
        }
      });
      
      // 休暇申請の集計
      leaveRequests.forEach(leave => {
        const userId = leave.userId;
        const user = userStats[userId];
        
        if (!user) return;
        
        user.leaveRequests.push(leave);
        
        // 有給休暇の集計
        if (leave.leaveType === 'PAID') {
          const startDate = new Date(leave.startDate);
          const endDate = new Date(leave.endDate);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          user.paidLeaveDays += diffDays;
        }
      });
      
      // 残業時間の多いユーザーをソート
      const sortedByOvertime = Object.values(userStats)
        .filter((user: any) => user.overtimeHours > 0)
        .sort((a: any, b: any) => b.overtimeHours - a.overtimeHours);
      
      // 休日労働の多いユーザーをソート
      const sortedByHolidayWork = Object.values(userStats)
        .filter((user: any) => user.holidayWorkDays > 0)
        .sort((a: any, b: any) => b.holidayWorkDays - a.holidayWorkDays);
      
      // 深夜労働の多いユーザーをソート
      const sortedByNightWork = Object.values(userStats)
        .filter((user: any) => user.nightWorkDays > 0)
        .sort((a: any, b: any) => b.nightWorkDays - a.nightWorkDays);
      
      // 休憩不足のユーザー
      const insufficientBreakUsers = Object.values(userStats)
        .filter((user: any) => user.insufficientBreakDays > 0)
        .sort((a: any, b: any) => b.insufficientBreakDays - a.insufficientBreakDays);
      
      // 有給休暇取得率の低いユーザー（年5日未満）
      const targetPaidLeaveDays = 5; // 年間の目標取得日数
      const lowPaidLeaveUsers = Object.values(userStats)
        .filter((user: any) => user.paidLeaveDays < targetPaidLeaveDays)
        .map((user: any) => ({
          userId: user.id,
          name: user.name,
          paidLeaveDays: user.paidLeaveDays,
          paidLeaveTarget: targetPaidLeaveDays,
          remainingDays: targetPaidLeaveDays - user.paidLeaveDays,
        }))
        .sort((a: any, b: any) => a.paidLeaveDays - b.paidLeaveDays);
      
      // 有給休暇取得目標達成者数
      const targetAchievedUsers = Object.values(userStats).filter(
        (user: any) => user.paidLeaveDays >= targetPaidLeaveDays
      ).length;
      
      // 全体の統計情報を計算
      const totalWorkingDays = Object.values(userStats).reduce(
        (sum: number, user: any) => sum + user.workingDays, 0
      );
      
      const totalOvertimeHours = Object.values(userStats).reduce(
        (sum: number, user: any) => sum + user.overtimeHours, 0
      );
      
      const excessiveOvertimeThreshold = 45; // 月45時間の残業時間上限
      const excessiveOvertimeCount = Object.values(userStats).filter(
        (user: any) => user.overtimeHours > excessiveOvertimeThreshold
      ).length;
      
      const totalHolidayWorkDays = Object.values(userStats).reduce(
        (sum: number, user: any) => sum + user.holidayWorkDays, 0
      );
      
      const totalHolidayWorkHours = Object.values(userStats).reduce(
        (sum: number, user: any) => sum + user.holidayWorkHours, 0
      );
      
      const holidayWorkUsers = Object.values(userStats).filter(
        (user: any) => user.holidayWorkDays > 0
      ).length;
      
      const totalNightWorkDays = Object.values(userStats).reduce(
        (sum: number, user: any) => sum + user.nightWorkDays, 0
      );
      
      const totalNightWorkHours = Object.values(userStats).reduce(
        (sum: number, user: any) => sum + user.nightWorkHours, 0
      );
      
      const nightWorkUsers = Object.values(userStats).filter(
        (user: any) => user.nightWorkDays > 0
      ).length;
      
      const totalInsufficientBreakDays = Object.values(userStats).reduce(
        (sum: number, user: any) => sum + user.insufficientBreakDays, 0
      );
      
      const totalPaidLeaveDays = Object.values(userStats).reduce(
        (sum: number, user: any) => sum + user.paidLeaveDays, 0
      );
      
      // レポートデータの作成
      const report = {
        period: {
          year: parseInt(year as string),
          month: parseInt(month as string),
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0],
        },
        companySummary: {
          totalUsers: users.length,
          activeUsers: users.filter(user => 
            attendanceRecords.some(record => record.userId === user.id)
          ).length,
        },
        complianceReport: {
          // 残業時間状況
          overtimeStatus: {
            totalOvertimeHours: totalOvertimeHours,
            averageOvertimeHours: users.length > 0 ? totalOvertimeHours / users.length : 0,
            excessiveOvertimeCount: excessiveOvertimeCount,
            excessiveOvertimeRate: users.length > 0 ? (excessiveOvertimeCount / users.length) * 100 : 0,
            topOvertimeUsers: sortedByOvertime.slice(0, 10).map(user => ({
              userId: user.id,
              name: user.name,
              overtimeHours: user.overtimeHours,
              excessDays: user.excessDays,
            })),
          },
          // 休憩取得状況
          breakTimeStatus: {
            totalWorkingDays: totalWorkingDays,
            insufficientBreakDays: totalInsufficientBreakDays,
            breakComplianceRate: totalWorkingDays > 0 
              ? ((totalWorkingDays - totalInsufficientBreakDays) / totalWorkingDays) * 100 
              : 100,
            insufficientBreakUsers: insufficientBreakUsers.slice(0, 10).map(user => ({
              userId: user.id,
              name: user.name,
              workingDays: user.workingDays,
              insufficientBreakDays: user.insufficientBreakDays,
              breakComplianceRate: user.workingDays > 0 
                ? ((user.workingDays - user.insufficientBreakDays) / user.workingDays) * 100 
                : 100,
            })),
          },
          // 休日労働状況
          holidayWorkStatus: {
            totalHolidayWorkDays: totalHolidayWorkDays,
            totalHolidayWorkHours: totalHolidayWorkHours,
            holidayWorkUsers: holidayWorkUsers,
            holidayWorkRate: users.length > 0 ? (holidayWorkUsers / users.length) * 100 : 0,
            topHolidayWorkUsers: sortedByHolidayWork.slice(0, 10).map(user => ({
              userId: user.id,
              name: user.name,
              holidayWorkDays: user.holidayWorkDays,
              holidayWorkHours: user.holidayWorkHours,
            })),
          },
          // 深夜労働状況
          nightWorkStatus: {
            totalNightWorkDays: totalNightWorkDays,
            totalNightWorkHours: totalNightWorkHours,
            nightWorkUsers: nightWorkUsers,
            nightWorkRate: users.length > 0 ? (nightWorkUsers / users.length) * 100 : 0,
            topNightWorkUsers: sortedByNightWork.slice(0, 10).map(user => ({
              userId: user.id,
              name: user.name,
              nightWorkDays: user.nightWorkDays,
              nightWorkHours: user.nightWorkHours,
            })),
          },
          // 有給休暇取得状況
          paidLeaveStatus: {
            totalPaidLeaveDays: totalPaidLeaveDays,
            averagePaidLeaveDays: users.length > 0 ? totalPaidLeaveDays / users.length : 0,
            targetAchievedUsers: targetAchievedUsers,
            targetAchievedRate: users.length > 0 ? (targetAchievedUsers / users.length) * 100 : 0,
            overallPaidLeaveRate: users.length > 0 
              ? (totalPaidLeaveDays / (users.length * targetPaidLeaveDays)) * 100 
              : 0,
            lowPaidLeaveUsers: lowPaidLeaveUsers,
          },
        },
      };
      
      return res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      console.error('Get company compliance report error:', error);
      return res.status(500).json({
        status: 'error',
        message: '会社レポートの取得中にエラーが発生しました',
      });
    }
  },
  
  // レポートエクスポート
  exportReport: async (req: Request, res: Response) => {
    try {
      // ユーザーIDの取得
      const currentUserId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';
      const companyId = req.user?.companyId;
      
      if (!currentUserId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // クエリパラメータの取得
      const { userId, year, month, type } = req.query;
      
      if (!userId || !year || !month || !type) {
        return res.status(400).json({
          status: 'error',
          message: 'ユーザーID、年、月、タイプは必須です',
        });
      }
      
      // 管理者でない場合は自分のレポートのみエクスポート可能
      if (!isAdmin && userId !== currentUserId) {
        return res.status(403).json({
          status: 'error',
          message: '他のユーザーのレポートをエクスポートする権限がありません',
        });
      }
      
      // 対象月の開始日と終了日
      const targetDate = new Date(
        parseInt(year as string),
        parseInt(month as string) - 1,
        1
      );
      const startOfMonth = getStartOfMonth(targetDate);
      const endOfMonth = getEndOfMonth(targetDate);
      
      // ユーザー情報の取得（同じ会社のユーザーのみ）
      const user = await prisma.user.findUnique({
        where: {
          id: userId as string,
          ...(isAdmin && companyId ? { companyId } : {}), // 管理者の場合は同じ会社のユーザーのみ
        },
        select: {
          id: true,
          name: true,
          email: true,
          companyId: true,
        },
      });
      
      if (!user || (isAdmin && user.companyId !== companyId)) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません、または権限がありません',
        });
      }
      
      // CSVデータの生成
      let csvData = '';
      let fileName = '';
      
      if (type === 'attendance') {
        // 勤怠記録の取得
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            userId: userId as string,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            user: {
              companyId: user.companyId, // 同じ会社のユーザーの記録のみ
            },
          },
          orderBy: {
            date: 'asc',
          },
        });
        
        csvData = generateAttendanceCSV(attendanceRecords);
        fileName = `attendance_${userId}_${year}_${month}.csv`;
      } else if (type === 'leave') {
        // 休暇申請の取得
        const leaveRequests = await prisma.leaveRequest.findMany({
          where: {
            userId: userId as string,
            OR: [
              {
                startDate: {
                  gte: startOfMonth,
                  lte: endOfMonth,
                },
              },
              {
                endDate: {
                  gte: startOfMonth,
                  lte: endOfMonth,
                },
              },
            ],
            user: {
              companyId: user.companyId, // 同じ会社のユーザーの記録のみ
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        });
        
        csvData = generateLeaveCSV(leaveRequests);
        fileName = `leave_${userId}_${year}_${month}.csv`;
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'タイプは attendance または leave である必要があります',
        });
      }
      
      // CSVレスポンスの送信
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      return res.status(200).send(csvData);
    } catch (error) {
      console.error('Export report error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'レポートのエクスポート中にエラーが発生しました',
      });
    }
  },
};
