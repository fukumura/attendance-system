import { Request, Response } from 'express';
import { prisma } from '../app';
import { z } from 'zod';
import { generatePublicCompanyId } from '../utils/companyUtils';

// 入力バリデーションスキーマ
const companySchema = z.object({
  name: z.string().min(1, '企業名は必須です'),
  logoUrl: z.string().url('有効なURLを入力してください').optional(),
  settings: z.record(z.any()).optional(),
});

const companyUpdateSchema = z.object({
  name: z.string().min(1, '企業名は必須です').optional(),
  logoUrl: z.string().url('有効なURLを入力してください').optional(),
  settings: z.record(z.any()).optional(),
});

export const companyController = {
  // 企業一覧取得（スーパー管理者のみ）
  getCompanies: async (req: Request, res: Response) => {
    try {
      // ページネーションパラメータ
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // 企業一覧の取得
      const companies = await (prisma as any).company.findMany({
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      });
      
      // 総企業数の取得
      const total = await (prisma as any).company.count();
      
      return res.status(200).json({
        status: 'success',
        data: companies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get companies error:', error);
      return res.status(500).json({
        status: 'error',
        message: '企業一覧の取得中にエラーが発生しました',
      });
    }
  },
  
  // 企業詳細取得
  getCompany: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // 企業の取得
      const company = await (prisma as any).company.findUnique({
        where: { 
          // IDまたは公開IDで検索
          ...(id.length === 36 ? { id } : { publicId: id })
        },
      });
      
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: '企業が見つかりません',
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: company,
      });
    } catch (error) {
      console.error('Get company error:', error);
      return res.status(500).json({
        status: 'error',
        message: '企業情報の取得中にエラーが発生しました',
      });
    }
  },
  
  // 企業作成（スーパー管理者のみ）
  createCompany: async (req: Request, res: Response) => {
    try {
      // リクエストボディのバリデーション
      const validatedData = companySchema.parse(req.body);
      
      // 企業の作成（一時的に空の公開IDで）
      const newCompany = await (prisma as any).company.create({
        data: {
          name: validatedData.name,
          logoUrl: validatedData.logoUrl,
          settings: validatedData.settings || {},
          publicId: 'TEMP', // 一時的な値
        },
      });
      
      // 公開IDを生成して更新
      const publicId = generatePublicCompanyId(newCompany.id);
      const updatedCompany = await (prisma as any).company.update({
        where: { id: newCompany.id },
        data: { publicId },
      });
      
      return res.status(201).json({
        status: 'success',
        data: updatedCompany,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Create company error:', error);
      return res.status(500).json({
        status: 'error',
        message: '企業作成中にエラーが発生しました',
      });
    }
  },
  
  // 企業更新（スーパー管理者のみ）
  updateCompany: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // リクエストボディのバリデーション
      const validatedData = companyUpdateSchema.parse(req.body);
      
      // 企業の存在確認
      const company = await (prisma as any).company.findUnique({
        where: { 
          // IDまたは公開IDで検索
          ...(id.length === 36 ? { id } : { publicId: id })
        },
      });
      
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: '企業が見つかりません',
        });
      }
      
      // 企業の更新
      const updatedCompany = await (prisma as any).company.update({
        where: { id: company.id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.logoUrl && { logoUrl: validatedData.logoUrl }),
          ...(validatedData.settings && { settings: validatedData.settings }),
        },
      });
      
      return res.status(200).json({
        status: 'success',
        data: updatedCompany,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0].message,
        });
      }
      
      console.error('Update company error:', error);
      return res.status(500).json({
        status: 'error',
        message: '企業更新中にエラーが発生しました',
      });
    }
  },
  
  // 企業削除（スーパー管理者のみ）
  deleteCompany: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // 企業の存在確認
      const company = await (prisma as any).company.findUnique({
        where: { 
          // IDまたは公開IDで検索
          ...(id.length === 36 ? { id } : { publicId: id })
        },
      });
      
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: '企業が見つかりません',
        });
      }
      
      // 関連するユーザーの確認
      const usersCount = await (prisma as any).user.count({
        where: { companyId: company.id },
      });
      
      if (usersCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'この企業にはユーザーが存在するため削除できません。先にユーザーを削除または移動してください。',
        });
      }
      
      // 企業の削除
      await (prisma as any).company.delete({
        where: { id: company.id },
      });
      
      return res.status(200).json({
        status: 'success',
        message: '企業を削除しました',
      });
    } catch (error) {
      console.error('Delete company error:', error);
      return res.status(500).json({
        status: 'error',
        message: '企業削除中にエラーが発生しました',
      });
    }
  },
  
  // 企業設定の取得
  getCompanySettings: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // 企業の取得
      const company = await (prisma as any).company.findUnique({
        where: { 
          // IDまたは公開IDで検索
          ...(id.length === 36 ? { id } : { publicId: id })
        },
        select: { settings: true },
      });
      
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: '企業が見つかりません',
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: company.settings || {},
      });
    } catch (error) {
      console.error('Get company settings error:', error);
      return res.status(500).json({
        status: 'error',
        message: '企業設定の取得中にエラーが発生しました',
      });
    }
  },
  
  // 企業設定の更新
  updateCompanySettings: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // 設定データのバリデーション
      const settings = z.record(z.any()).parse(req.body);
      
      // 企業の存在確認
      const company = await (prisma as any).company.findUnique({
        where: { 
          // IDまたは公開IDで検索
          ...(id.length === 36 ? { id } : { publicId: id })
        },
      });
      
      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: '企業が見つかりません',
        });
      }
      
      // 企業設定の更新
      const updatedCompany = await (prisma as any).company.update({
        where: { id: company.id },
        data: { settings },
      });
      
      return res.status(200).json({
        status: 'success',
        data: updatedCompany.settings,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: '無効な設定データです',
        });
      }
      
      console.error('Update company settings error:', error);
      return res.status(500).json({
        status: 'error',
        message: '企業設定の更新中にエラーが発生しました',
      });
    }
  },
};
