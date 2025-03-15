import { Request, Response } from 'express';
import { prisma } from '../app';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 入力バリデーションスキーマ
const userSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
  name: z.string().min(1, '名前は必須です'),
  role: z.enum(['ADMIN', 'EMPLOYEE']).default('EMPLOYEE'),
});

const userUpdateSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください').optional(),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります').optional(),
  name: z.string().min(1, '名前は必須です').optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
});

export const adminController = {
  // ユーザー一覧取得
  getUsers: async (req: Request, res: Response) => {
    console.log('getUsers: Start');
    try {
      // ページネーションパラメータ
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      console.log(`getUsers: Pagination params - page: ${page}, limit: ${limit}, skip: ${skip}`);
      
      // データベース接続状態の確認
      try {
        console.log('getUsers: Testing database connection...');
        await prisma.$queryRaw`SELECT 1`;
        console.log('getUsers: Database connection is working');
      } catch (dbError) {
        console.error('getUsers: Database connection test failed:', dbError);
        throw new Error(`Database connection error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      }
      
      console.log('getUsers: Fetching users from database...');
      // ユーザー一覧の取得
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      console.log(`getUsers: Found ${users.length} users`);
      
      // 総ユーザー数の取得
      console.log('getUsers: Counting total users...');
      const total = await prisma.user.count();
      console.log(`getUsers: Total users: ${total}`);
      
      console.log('getUsers: Sending response');
      return res.status(200).json({
        status: 'success',
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('getUsers error:', error);
      // エラーの詳細情報を出力
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      return res.status(500).json({
        status: 'error',
        message: 'ユーザー一覧の取得中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },
  
  // ユーザー詳細取得
  getUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // ユーザーの取得
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません',
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'ユーザー情報の取得中にエラーが発生しました',
      });
    }
  },
  
  // ユーザー作成
  createUser: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = userSchema.parse(req.body);
      
      // メールアドレスの重複チェック
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'このメールアドレスは既に登録されています',
        });
      }
      
      // パスワードのハッシュ化
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // ユーザーの作成
      const newUser = await prisma.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          role: validatedData.role,
        },
      });
      
      // パスワードを除外したユーザー情報を返却
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json({
        status: 'success',
        data: userWithoutPassword,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Create user error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'ユーザー作成中にエラーが発生しました',
      });
    }
  },
  
  // ユーザー更新
  updateUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // リクエストボディのバリデーション
      const validatedData = userUpdateSchema.parse(req.body);
      
      // 更新データの準備
      const updateData: any = {};
      
      if (validatedData.email) {
        // メールアドレスの重複チェック
        const existingUser = await prisma.user.findFirst({
          where: {
            email: validatedData.email,
            id: { not: id },
          },
        });
        
        if (existingUser) {
          return res.status(400).json({
            status: 'error',
            message: 'このメールアドレスは既に使用されています',
          });
        }
        
        updateData.email = validatedData.email;
      }
      
      if (validatedData.password) {
        // パスワードのハッシュ化
        updateData.password = await bcrypt.hash(validatedData.password, 10);
      }
      
      if (validatedData.name) {
        updateData.name = validatedData.name;
      }
      
      if (validatedData.role) {
        updateData.role = validatedData.role;
      }
      
      // ユーザーの更新
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });
      
      // パスワードを除外したユーザー情報を返却
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json({
        status: 'success',
        data: userWithoutPassword,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Update user error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'ユーザー更新中にエラーが発生しました',
      });
    }
  },
  
  // ユーザー削除
  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // 自分自身を削除しようとしていないか確認
      if (req.user?.id === id) {
        return res.status(400).json({
          status: 'error',
          message: '自分自身を削除することはできません',
        });
      }
      
      // ユーザーの削除
      await prisma.user.delete({
        where: { id },
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'ユーザーを削除しました',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'ユーザー削除中にエラーが発生しました',
      });
    }
  },
};
