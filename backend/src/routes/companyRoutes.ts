import express from 'express';
import { companyController } from '../controllers/companyController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';
import { requireSuperAdmin } from '../middlewares/companyMiddleware';

const router = express.Router();

// すべてのルートで認証を要求
router.use(authenticate);

// 企業一覧取得（スーパー管理者のみ）
router.get('/', requireSuperAdmin, companyController.getCompanies);

// 企業作成（スーパー管理者のみ）
router.post('/', requireSuperAdmin, companyController.createCompany);

// 企業詳細取得（スーパー管理者または該当企業の管理者）
router.get('/:id', companyController.getCompany);

// 企業更新（スーパー管理者のみ）
router.put('/:id', requireSuperAdmin, companyController.updateCompany);

// 企業削除（スーパー管理者のみ）
router.delete('/:id', requireSuperAdmin, companyController.deleteCompany);

// 企業設定取得（スーパー管理者または該当企業の管理者）
router.get('/:id/settings', companyController.getCompanySettings);

// 企業設定更新（スーパー管理者または該当企業の管理者）
router.put('/:id/settings', requireAdmin, companyController.updateCompanySettings);

export default router;
