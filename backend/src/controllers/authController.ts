import { Request, Response } from 'express';
import { prisma } from '../app';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// 入力バリデーションスキーマ
const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
  name: z.string().min(1, '名前は必須です'),
});

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
});

// JWTトークン生成関数
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ userId }, secret, { expiresIn: '24h' });
};

export const authController = {
  // ユーザー登録（管理者のみ実行可能）
  register: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = registerSchema.parse(req.body);
      
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
          role: 'EMPLOYEE', // デフォルトは一般従業員
        },
      });
      
      // パスワードを除外したユーザー情報を返却
      const { password, ...userWithoutPassword } = newUser;
      
      // JWTトークンの生成
      const token = generateToken(newUser.id);
      
      return res.status(201).json({
        status: 'success',
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Register error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'ユーザー登録中にエラーが発生しました',
      });
    }
  },
  
  // ログイン
  login: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = loginSchema.parse(req.body);
      
      // ユーザーの検索
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'メールアドレスまたはパスワードが正しくありません',
        });
      }
      
      // パスワードの検証
      const isPasswordValid = await bcrypt.compare(
        validatedData.password,
        user.password
      );
      
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'メールアドレスまたはパスワードが正しくありません',
        });
      }
      
      // パスワードを除外したユーザー情報を返却
      const { password, ...userWithoutPassword } = user;
      
      // JWTトークンの生成
      const token = generateToken(user.id);
      
      return res.status(200).json({
        status: 'success',
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Login error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'ログイン中にエラーが発生しました',
      });
    }
  },
  
  // 現在のユーザー情報取得
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      // リクエストからユーザーIDを取得（認証ミドルウェアで設定）
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // ユーザー情報の取得
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません',
        });
      }
      
      // パスワードを除外したユーザー情報を返却
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json({
        status: 'success',
        data: userWithoutPassword,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'ユーザー情報の取得中にエラーが発生しました',
      });
    }
  },
};
