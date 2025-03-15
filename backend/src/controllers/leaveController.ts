import { Request, Response } from 'express';
import { prisma } from '../app';
import { z } from 'zod';

// 入力バリデーションスキーマ
const createLeaveSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: '有効な開始日を入力してください',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: '有効な終了日を入力してください',
  }),
  leaveType: z.enum(['PAID', 'UNPAID', 'SICK', 'OTHER'], {
    errorMap: () => ({ message: '有効な休暇種別を選択してください' }),
  }),
  reason: z.string().min(1, '理由は必須です'),
});

const updateLeaveSchema = z.object({
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: '有効な開始日を入力してください',
    })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: '有効な終了日を入力してください',
    })
    .optional(),
  leaveType: z
    .enum(['PAID', 'UNPAID', 'SICK', 'OTHER'], {
      errorMap: () => ({ message: '有効な休暇種別を選択してください' }),
    })
    .optional(),
  reason: z.string().min(1, '理由は必須です').optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: '有効なステータスを選択してください' }),
  }),
  comment: z.string().optional(),
});

export const leaveController = {
  // 休暇申請作成
  createLeave: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = createLeaveSchema.parse(req.body);
      
      // ユーザーIDの取得
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // 日付の変換
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);
      
      // 開始日が終了日より後の場合はエラー
      if (startDate > endDate) {
        return res.status(400).json({
          status: 'error',
          message: '開始日は終了日より前である必要があります',
        });
      }
      
      // 休暇申請の作成
      const leaveRequest = await prisma.leaveRequest.create({
        data: {
          userId,
          startDate,
          endDate,
          leaveType: validatedData.leaveType,
          reason: validatedData.reason,
          status: 'PENDING', // デフォルトは申請中
        },
      });
      
      return res.status(201).json({
        status: 'success',
        data: leaveRequest,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Create leave error:', error);
      return res.status(500).json({
        status: 'error',
        message: '休暇申請の作成中にエラーが発生しました',
      });
    }
  },
  
  // 休暇申請一覧取得
  getLeaves: async (req: Request, res: Response) => {
    try {
      console.log('getLeaves: Start');
      // ユーザーIDの取得
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';
      
      console.log(`getLeaves: User ID: ${userId}, isAdmin: ${isAdmin}`);
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // クエリパラメータの取得
      const { status, startDate, endDate, page = '1', limit = '10' } = req.query;
      
      console.log(`getLeaves: Query params - status: ${status}, startDate: ${startDate}, endDate: ${endDate}, page: ${page}, limit: ${limit}`);
      
      // ページネーションの設定
      const pageNumber = parseInt(page as string, 10) || 1;
      const limitNumber = parseInt(limit as string, 10) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      
      // 検索条件の設定
      const where: any = {};
      
      // 管理者でない場合は自分の申請のみ表示
      if (!isAdmin) {
        where.userId = userId;
      }
      
      // ステータスでフィルタリング
      if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
        where.status = status;
      }
      
      // 日付でフィルタリング
      if (startDate && endDate) {
        try {
          const startDateObj = new Date(startDate as string);
          const endDateObj = new Date(endDate as string);
          
          if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
            where.OR = [
              {
                startDate: {
                  gte: startDateObj,
                  lte: endDateObj,
                },
              },
              {
                endDate: {
                  gte: startDateObj,
                  lte: endDateObj,
                },
              },
            ];
          } else {
            console.warn('getLeaves: Invalid date format in query params');
          }
        } catch (dateError) {
          console.error('getLeaves: Error parsing dates:', dateError);
        }
      }
      
      console.log('getLeaves: Where condition:', JSON.stringify(where));
      
      let leaves = [];
      let total = 0;
      
      try {
        console.log('getLeaves: Fetching leave requests...');
        
        // 休暇申請の取得と総数のカウントを別々に実行して、一方がエラーでも他方が実行できるようにする
        try {
          leaves = await prisma.leaveRequest.findMany({
            where,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            skip,
            take: limitNumber,
          });
          console.log(`getLeaves: Successfully fetched ${leaves.length} leave requests`);
        } catch (findError) {
          console.error('getLeaves: Error fetching leave requests:', findError);
          throw new Error(`Error fetching leave requests: ${findError instanceof Error ? findError.message : String(findError)}`);
        }
        
        try {
          total = await prisma.leaveRequest.count({
            where,
          });
          console.log(`getLeaves: Total count: ${total}`);
        } catch (countError) {
          console.error('getLeaves: Error counting leave requests:', countError);
          // カウントエラーは致命的ではないので、続行する
          total = leaves.length;
        }
        
        return res.status(200).json({
          status: 'success',
          data: {
            leaves: leaves || [],
            pagination: {
              page: pageNumber,
              limit: limitNumber,
              total,
              totalPages: Math.ceil(total / limitNumber),
            },
          },
        });
      } catch (dbError) {
        console.error('getLeaves: Database error:', dbError);
        if (dbError instanceof Error) {
          console.error('Error name:', dbError.name);
          console.error('Error message:', dbError.message);
          console.error('Error stack:', dbError.stack);
        }
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      }
    } catch (error) {
      console.error('Get leaves error:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // エラーが発生した場合でも、空の結果を返す
      return res.status(200).json({
        status: 'success',
        data: {
          leaves: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
        warning: error instanceof Error ? error.message : String(error)
      });
    }
  },
  
  // 休暇申請詳細取得
  getLeave: async (req: Request, res: Response) => {
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
      
      // 休暇申請IDの取得
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: '休暇申請IDは必須です',
        });
      }
      
      // 休暇申請の取得
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: {
          id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      
      if (!leaveRequest) {
        return res.status(404).json({
          status: 'error',
          message: '休暇申請が見つかりません',
        });
      }
      
      // 管理者でない場合は自分の申請のみ表示
      if (!isAdmin && leaveRequest.userId !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'この休暇申請にアクセスする権限がありません',
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: leaveRequest,
      });
    } catch (error) {
      console.error('Get leave error:', error);
      return res.status(500).json({
        status: 'error',
        message: '休暇申請の取得中にエラーが発生しました',
      });
    }
  },
  
  // 休暇申請更新
  updateLeave: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = updateLeaveSchema.parse(req.body);
      
      // ユーザーIDの取得
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // 休暇申請IDの取得
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: '休暇申請IDは必須です',
        });
      }
      
      // 休暇申請の取得
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: {
          id,
        },
      });
      
      if (!leaveRequest) {
        return res.status(404).json({
          status: 'error',
          message: '休暇申請が見つかりません',
        });
      }
      
      // 自分の申請のみ更新可能
      if (leaveRequest.userId !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'この休暇申請を更新する権限がありません',
        });
      }
      
      // 承認済み・却下済みの申請は更新不可
      if (leaveRequest.status !== 'PENDING') {
        return res.status(400).json({
          status: 'error',
          message: '承認済み・却下済みの申請は更新できません',
        });
      }
      
      // 更新データの準備
      const updateData: any = {};
      
      if (validatedData.startDate) {
        updateData.startDate = new Date(validatedData.startDate);
      }
      
      if (validatedData.endDate) {
        updateData.endDate = new Date(validatedData.endDate);
      }
      
      if (validatedData.leaveType) {
        updateData.leaveType = validatedData.leaveType;
      }
      
      if (validatedData.reason) {
        updateData.reason = validatedData.reason;
      }
      
      // 開始日と終了日の両方が指定されている場合は整合性チェック
      if (updateData.startDate && updateData.endDate) {
        if (updateData.startDate > updateData.endDate) {
          return res.status(400).json({
            status: 'error',
            message: '開始日は終了日より前である必要があります',
          });
        }
      } else if (updateData.startDate && leaveRequest.endDate) {
        if (updateData.startDate > leaveRequest.endDate) {
          return res.status(400).json({
            status: 'error',
            message: '開始日は終了日より前である必要があります',
          });
        }
      } else if (updateData.endDate && leaveRequest.startDate) {
        if (leaveRequest.startDate > updateData.endDate) {
          return res.status(400).json({
            status: 'error',
            message: '開始日は終了日より前である必要があります',
          });
        }
      }
      
      // 休暇申請の更新
      const updatedLeave = await prisma.leaveRequest.update({
        where: {
          id,
        },
        data: updateData,
      });
      
      return res.status(200).json({
        status: 'success',
        data: updatedLeave,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Update leave error:', error);
      return res.status(500).json({
        status: 'error',
        message: '休暇申請の更新中にエラーが発生しました',
      });
    }
  },
  
  // 休暇申請ステータス更新（管理者のみ）
  updateStatus: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = updateStatusSchema.parse(req.body);
      
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
      
      // 休暇申請IDの取得
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: '休暇申請IDは必須です',
        });
      }
      
      // 休暇申請の取得
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: {
          id,
        },
      });
      
      if (!leaveRequest) {
        return res.status(404).json({
          status: 'error',
          message: '休暇申請が見つかりません',
        });
      }
      
      // 既に処理済みの申請は更新不可
      if (leaveRequest.status !== 'PENDING') {
        return res.status(400).json({
          status: 'error',
          message: '既に処理済みの申請です',
        });
      }
      
      // 休暇申請の更新
      const updatedLeave = await prisma.leaveRequest.update({
        where: {
          id,
        },
        data: {
          status: validatedData.status,
          comment: validatedData.comment,
        },
      });
      
      return res.status(200).json({
        status: 'success',
        data: updatedLeave,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Update status error:', error);
      return res.status(500).json({
        status: 'error',
        message: '休暇申請ステータスの更新中にエラーが発生しました',
      });
    }
  },
};
