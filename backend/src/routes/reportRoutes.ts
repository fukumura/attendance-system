import express from 'express';
import { reportController } from '../controllers/reportController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// すべてのルートで認証が必要
router.use(authenticate);

// ユーザー別レポート取得
router.get('/user/:userId', reportController.getUserReport);

// 部門別レポート取得（管理者のみ）
router.get('/department', requireAdmin, reportController.getDepartmentReport);

// 会社全体のコンプライアンスレポート取得（管理者のみ）
router.get('/company/compliance', requireAdmin, reportController.getCompanyComplianceReport);

// レポートエクスポート
router.get('/export', reportController.exportReport);

export default router;
