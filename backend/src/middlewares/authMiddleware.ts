import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';

// JWTペイロードの型定義
interface JwtPayload {
  userId: string;
  companyId?: string | null;
  role?: string;
}

// Requestインターフェースの拡張
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        companyId?: string | null;
      };
    }
  }
}

// 認証ミドルウェア
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: '認証が必要です',
      });
    }
    
    // トークンの取得
    const token = authHeader.split(' ')[1];
    
    // トークンの検証
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // ユーザーの取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '無効なトークンです',
      });
    }
    
    // リクエストにユーザー情報を追加（パスワードは除外）
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword as any;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 'error',
        message: '無効なトークンです',
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 'error',
        message: 'トークンの有効期限が切れています',
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: '認証中にエラーが発生しました',
    });
  }
};

// 管理者権限チェックミドルウェア
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: '認証が必要です',
    });
  }
  
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      status: 'error',
      message: '管理者権限が必要です',
    });
  }
  
  next();
};

// スーパー管理者権限チェックミドルウェア
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: '認証が必要です',
    });
  }
  
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      status: 'error',
      message: 'スーパー管理者権限が必要です',
    });
  }
  
  next();
};
