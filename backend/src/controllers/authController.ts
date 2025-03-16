import { Request, Response } from 'express';
import { prisma } from '../app';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from '../services/emailService';

// 入力バリデーションスキーマ
const profileUpdateSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードは必須です'),
  newPassword: z.string().min(6, '新しいパスワードは6文字以上である必要があります'),
});

const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
  name: z.string().min(1, '名前は必須です'),
  companyId: z.string().optional(), // 企業ID（オプション）
});

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'トークンは必須です'),
  userId: z.string().min(1, 'ユーザーIDは必須です'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

// JWTトークン生成関数
const generateToken = (userId: string, companyId: string | null, role: string): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ userId, companyId, role }, secret, { expiresIn: '24h' });
};

// 認証トークン生成関数
const generateVerificationToken = (): string => {
  return uuidv4();
};

// 認証トークン有効期限設定関数（24時間）
const getVerificationTokenExpiry = (): Date => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
};

export const authController = {
  // メールアドレス認証
  verifyEmail: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = verifyEmailSchema.parse(req.body);
      
      // ユーザーの検索
      const user = await prisma.user.findUnique({
        where: { id: validatedData.userId },
      });
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'ユーザーが見つかりません',
        });
      }
      
      // 既に認証済みの場合
      if (user.isEmailVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'このメールアドレスは既に認証されています',
        });
      }
      
      // トークンの検証
      if (
        !user.verificationToken ||
        user.verificationToken !== validatedData.token ||
        !user.verificationTokenExpiry ||
        new Date() > user.verificationTokenExpiry
      ) {
        return res.status(400).json({
          status: 'error',
          message: '無効または期限切れの認証トークンです',
        });
      }
      
      // ユーザーを認証済みに更新
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });
      
      // パスワードを除外したユーザー情報を返却
      const { password, ...userWithoutPassword } = updatedUser;
      
      // JWTトークンの生成
      const token = generateToken(updatedUser.id, updatedUser.companyId, updatedUser.role);
      
      return res.status(200).json({
        status: 'success',
        message: 'メールアドレスが正常に認証されました',
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
      
      console.error('Verify email error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'メールアドレス認証中にエラーが発生しました',
      });
    }
  },
  
  // 認証トークン再送信
  resendVerification: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = resendVerificationSchema.parse(req.body);
      
      // ユーザーの検索
      const user = await prisma.user.findFirst({
        where: { email: validatedData.email },
      });
      
      if (!user) {
        // セキュリティのため、ユーザーが存在しない場合でも成功レスポンスを返す
        return res.status(200).json({
          status: 'success',
          message: '認証メールを送信しました（存在する場合）',
        });
      }
      
      // 既に認証済みの場合
      if (user.isEmailVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'このメールアドレスは既に認証されています',
        });
      }
      
      // 新しい認証トークンを生成
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = getVerificationTokenExpiry();
      
      // ユーザー情報を更新
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationTokenExpiry,
        },
      });
      
      // 認証メールを送信
      await emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken,
        user.id
      );
      
      return res.status(200).json({
        status: 'success',
        message: '認証メールを再送信しました',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Resend verification error:', error);
      return res.status(500).json({
        status: 'error',
        message: '認証メール再送信中にエラーが発生しました',
      });
    }
  },
  // プロフィール更新
  updateProfile: async (req: Request, res: Response) => {
    try {
      // リクエストからユーザーIDを取得（認証ミドルウェアで設定）
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // リクエストボディのバリデーション
      const validatedData = profileUpdateSchema.parse(req.body);
      
      // メールアドレスの重複チェック（自分以外）
      if (validatedData.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: validatedData.email,
            id: { not: userId },
          },
        });
        
        if (existingUser) {
          return res.status(400).json({
            status: 'error',
            message: 'このメールアドレスは既に使用されています',
          });
        }
      }
      
      // ユーザー情報の更新
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: validatedData.name,
          email: validatedData.email,
        },
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
      
      console.error('Update profile error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'プロフィール更新中にエラーが発生しました',
      });
    }
  },
  
  // パスワード変更
  changePassword: async (req: Request, res: Response) => {
    try {
      // リクエストからユーザーIDを取得（認証ミドルウェアで設定）
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: '認証が必要です',
        });
      }
      
      // リクエストボディのバリデーション
      const validatedData = passwordChangeSchema.parse(req.body);
      
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
      
      // 現在のパスワードの検証
      const isPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.password
      );
      
      if (!isPasswordValid) {
        return res.status(400).json({
          status: 'error',
          message: '現在のパスワードが正しくありません',
        });
      }
      
      // 新しいパスワードのハッシュ化
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
      
      // パスワードの更新
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
        },
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'パスワードが正常に変更されました',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Change password error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'パスワード変更中にエラーが発生しました',
      });
    }
  },
  
  // 初期セットアップ（最初の管理者ユーザー作成）
  setupAdmin: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = registerSchema.parse(req.body);
      
      // 管理者ユーザーが既に存在するか確認
      const adminExists = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
      
      if (adminExists) {
        return res.status(403).json({
          status: 'error',
          message: '管理者ユーザーは既に存在します。このエンドポイントは使用できません。',
        });
      }
      
      // メールアドレスの重複チェック
      const existingUser = await prisma.user.findFirst({
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
      
      // 管理者ユーザーの作成
      const newAdmin = await prisma.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          role: 'ADMIN', // 管理者ロールを設定
        },
      });
      
      // パスワードを除外したユーザー情報を返却
      const { password, ...userWithoutPassword } = newAdmin;
      
      // JWTトークンの生成
      const token = generateToken(newAdmin.id, null, newAdmin.role);
      
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
      
      console.error('Setup admin error:', error);
      return res.status(500).json({
        status: 'error',
        message: '管理者ユーザー作成中にエラーが発生しました',
      });
    }
  },
  
  // ユーザー登録（管理者のみ実行可能）
  register: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = registerSchema.parse(req.body);
      
      // メールアドレスの重複チェック
      const existingUser = await prisma.user.findFirst({
        where: { email: validatedData.email },
      });
      
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'このメールアドレスは既に登録されています',
        });
      }
      
      // 企業IDの検証（指定されている場合）
      let companyId = null;
      if (validatedData.companyId) {
        const company = await prisma.company.findFirst({
          where: { publicId: validatedData.companyId },
        });
        
        if (!company) {
          return res.status(400).json({
            status: 'error',
            message: '指定された企業IDは存在しません',
          });
        }
        
        companyId = company.id;
      }
      
      // パスワードのハッシュ化
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // 認証トークンの生成
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = getVerificationTokenExpiry();
      
      // ユーザーの作成
      const newUser = await prisma.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          role: 'EMPLOYEE', // デフォルトは一般従業員
          companyId: companyId, // 企業ID（検証済み）
          isEmailVerified: false,
          verificationToken,
          verificationTokenExpiry,
        },
      });
      
      // 認証メールを送信
      await emailService.sendVerificationEmail(
        newUser.email,
        newUser.name,
        verificationToken,
        newUser.id
      );
      
      // パスワードを除外したユーザー情報を返却
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json({
        status: 'success',
        message: 'ユーザーが作成され、認証メールが送信されました',
        data: {
          user: userWithoutPassword,
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
      const user = await prisma.user.findFirst({
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
      
      // メール認証チェック
      if (!user.isEmailVerified) {
        return res.status(403).json({
          status: 'error',
          message: 'メールアドレスが認証されていません。認証メールを確認してください。',
          needsVerification: true,
          email: user.email,
        });
      }
      
      // パスワードを除外したユーザー情報を返却
      const { password, ...userWithoutPassword } = user;
      
      // JWTトークンの生成
      const token = generateToken(user.id, user.companyId, user.role);
      
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
