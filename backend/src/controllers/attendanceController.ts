import { Request, Response } from 'express';
import { prisma } from '../app';
import { z } from 'zod';

// 入力バリデーションスキーマ
const clockInSchema = z.object({
  location: z.string().optional(),
  notes: z.string().optional(),
});

const clockOutSchema = z.object({
  location: z.string().optional(),
  notes: z.string().optional(),
});

// 日付ユーティリティ関数
const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

const getEndOfDay = (date: Date): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

export const attendanceController = {
  // 出勤打刻
  clockIn: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = clockInSchema.parse(req.body);
      
      // ユーザーIDの取得
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // 今日の日付
      const today = new Date();
      const startOfDay = getStartOfDay(today);
      const endOfDay = getEndOfDay(today);
      
      // 既に今日の出勤記録があるか確認
      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      
      if (existingRecord) {
        return res.status(400).json({
          status: 'error',
          message: '既に今日の出勤記録が存在します',
        });
      }
      
      // 出勤記録の作成
      const attendanceRecord = await prisma.attendanceRecord.create({
        data: {
          userId,
          date: today,
          clockInTime: today,
          location: validatedData.location,
          notes: validatedData.notes,
        },
      });
      
      return res.status(201).json({
        status: 'success',
        data: attendanceRecord,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Clock in error:', error);
      return res.status(500).json({
        status: 'error',
        message: '出勤打刻中にエラーが発生しました',
      });
    }
  },
  
  // 退勤打刻
  clockOut: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = clockOutSchema.parse(req.body);
      
      // ユーザーIDの取得
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // 今日の日付
      const today = new Date();
      const startOfDay = getStartOfDay(today);
      const endOfDay = getEndOfDay(today);
      
      // 今日の出勤記録を取得
      const attendanceRecord = await prisma.attendanceRecord.findFirst({
        where: {
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      
      if (!attendanceRecord) {
        return res.status(404).json({
          status: 'error',
          message: '今日の出勤記録が見つかりません',
        });
      }
      
      if (attendanceRecord.clockOutTime) {
        return res.status(400).json({
          status: 'error',
          message: '既に退勤打刻が完了しています',
        });
      }
      
      // 退勤記録の更新
      const updatedRecord = await prisma.attendanceRecord.update({
        where: {
          id: attendanceRecord.id,
        },
        data: {
          clockOutTime: today,
          location: validatedData.location || attendanceRecord.location,
          notes: validatedData.notes || attendanceRecord.notes,
        },
      });
      
      return res.status(200).json({
        status: 'success',
        data: updatedRecord,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Clock out error:', error);
      return res.status(500).json({
        status: 'error',
        message: '退勤打刻中にエラーが発生しました',
      });
    }
  },
  
  // 今日の勤怠状態取得
  getToday: async (req: Request, res: Response) => {
    try {
      console.log('getToday: Start');
      // ユーザーIDの取得
      const userId = req.user?.id;
      
      console.log(`getToday: User ID: ${userId}`);
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // 今日の日付
      const today = new Date();
      const startOfDay = getStartOfDay(today);
      const endOfDay = getEndOfDay(today);
      
      console.log(`getToday: Date range - ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
      
      try {
        console.log('getToday: Fetching attendance record...');
        // 今日の勤怠記録を取得
        const attendanceRecord = await prisma.attendanceRecord.findFirst({
          where: {
            userId,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });
        
        console.log(`getToday: Attendance record found: ${!!attendanceRecord}`);
        if (attendanceRecord) {
          console.log(`getToday: Record details - clockInTime: ${attendanceRecord.clockInTime}, clockOutTime: ${attendanceRecord.clockOutTime || 'null'}`);
        }
        
        // 勤怠状態の判定
        const status = {
          isClockedIn: !!attendanceRecord,
          isClockedOut: !!(attendanceRecord?.clockOutTime),
          record: attendanceRecord || null,
        };
        
        console.log(`getToday: Status - isClockedIn: ${status.isClockedIn}, isClockedOut: ${status.isClockedOut}`);
        
        return res.status(200).json({
          status: 'success',
          data: status,
        });
      } catch (dbError) {
        console.error('getToday: Database error:', dbError);
        if (dbError instanceof Error) {
          console.error('Error name:', dbError.name);
          console.error('Error message:', dbError.message);
          console.error('Error stack:', dbError.stack);
        }
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      }
    } catch (error) {
      console.error('Get today status error:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return res.status(500).json({
        status: 'error',
        message: '勤怠状態の取得中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },
  
  // 勤怠記録一覧取得
  getRecords: async (req: Request, res: Response) => {
    try {
      // ユーザーIDの取得
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // クエリパラメータの取得
      const { startDate, endDate, page = '1', limit = '10' } = req.query;
      
      // ページネーションの設定
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;
      
      // 検索条件の設定
      const where: any = { userId };
      
      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }
      
      // 勤怠記録の取得
      const [records, total] = await Promise.all([
        prisma.attendanceRecord.findMany({
          where,
          orderBy: {
            date: 'desc',
          },
          skip,
          take: limitNumber,
        }),
        prisma.attendanceRecord.count({
          where,
        }),
      ]);
      
      return res.status(200).json({
        status: 'success',
        data: {
          records,
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
          },
        },
      });
    } catch (error) {
      console.error('Get records error:', error);
      return res.status(500).json({
        status: 'error',
        message: '勤怠記録の取得中にエラーが発生しました',
      });
    }
  },
  
  // 勤務時間サマリー取得
  getSummary: async (req: Request, res: Response) => {
    try {
      // ユーザーIDの取得
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // クエリパラメータの取得
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: '開始日と終了日は必須です',
        });
      }
      
      // 検索条件の設定
      const where = {
        userId,
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
        clockOutTime: {
          not: null,
        },
      };
      
      // 勤怠記録の取得
      const records = await prisma.attendanceRecord.findMany({
        where,
        orderBy: {
          date: 'asc',
        },
      });
      
      // 勤務時間の計算
      let totalWorkingMinutes = 0;
      const dailyWorkingHours: { date: string; hours: number }[] = [];
      
      records.forEach((record: any) => {
        if (record.clockOutTime) {
          const clockInTime = new Date(record.clockInTime);
          const clockOutTime = new Date(record.clockOutTime);
          const workingMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60);
          
          totalWorkingMinutes += workingMinutes;
          
          const dateStr = record.date.toISOString().split('T')[0];
          const hours = workingMinutes / 60;
          
          dailyWorkingHours.push({
            date: dateStr,
            hours,
          });
        }
      });
      
      // サマリーの作成
      const summary = {
        totalWorkingHours: totalWorkingMinutes / 60,
        totalWorkingDays: records.length,
        averageWorkingHours: records.length > 0 ? totalWorkingMinutes / 60 / records.length : 0,
        dailyWorkingHours,
      };
      
      return res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      console.error('Get summary error:', error);
      return res.status(500).json({
        status: 'error',
        message: '勤務時間サマリーの取得中にエラーが発生しました',
      });
    }
  },
};
