import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import { findCompanyIdByPublicId } from '../utils/companyUtils';

// Requestインターフェースの拡張
declare global {
  namespace Express {
    interface Request {
      companyContext?: {
        companyId: string | null;
      };
    }
  }
}

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

// 企業コンテキストミドルウェア
export const companyContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // JWTからロールを取得
    const role = req.user?.role;
    
    if (!role) {
      return res.status(401).json({
        status: 'error',
        message: '認証が必要です',
      });
    }
    
    // SUPER_ADMINの場合、ヘッダーから企業IDを取得（任意）
    if (role === 'SUPER_ADMIN') {
      const companyPublicId = req.headers['x-company-id'] as string;
      
      if (companyPublicId) {
        // 公開IDから実際の企業IDを取得
        const companyId = await findCompanyIdByPublicId(prisma, companyPublicId);
        
        if (companyId) {
          req.companyContext = { companyId };
        } else {
          return res.status(404).json({
            status: 'error',
            message: '指定された企業が見つかりません',
          });
        }
      } else {
        // ヘッダーがない場合はcompanyIdをnullに設定（全企業データにアクセス可能）
        req.companyContext = { companyId: null };
      }
    } else {
      // 通常ユーザーの場合はJWTから企業IDを取得
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(401).json({
          status: 'error',
          message: '企業IDが見つかりません',
        });
      }
      
      req.companyContext = { companyId };
    }
    
    next();
  } catch (error) {
    console.error('Company context error:', error);
    return res.status(500).json({
      status: 'error',
      message: '企業コンテキストの設定中にエラーが発生しました',
    });
  }
};

// 企業アクセス権限チェックミドルウェア
export const checkCompanyAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    const userCompanyId = req.user?.companyId;
    
    // スーパー管理者は全ての企業にアクセス可能
    if (role === 'SUPER_ADMIN') {
      return next();
    }
    
    // IDまたは公開IDから企業を検索
    const company = await (prisma as any).company.findFirst({
      where: {
        OR: [
          { id },
          { publicId: id }
        ]
      },
      select: { id: true }
    });
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: '企業が見つかりません',
      });
    }
    
    // ユーザーが所属する企業と一致するか確認
    if (company.id !== userCompanyId) {
      return res.status(403).json({
        status: 'error',
        message: 'この企業のデータにアクセスする権限がありません',
      });
    }
    
    next();
  } catch (error) {
    console.error('Check company access error:', error);
    return res.status(500).json({
      status: 'error',
      message: '企業アクセス権限の確認中にエラーが発生しました',
    });
  }
};
