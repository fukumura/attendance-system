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
      
      // ユーザー情報の取得
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません',
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
      
      // 全ユーザーの取得
      const users = await prisma.user.findMany({
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
  
  // レポートエクスポート
  exportReport: async (req: Request, res: Response) => {
    try {
      // ユーザーIDの取得
      const currentUserId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';
      
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
      
      // ユーザー情報の取得
      const user = await prisma.user.findUnique({
        where: {
          id: userId as string,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません',
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
