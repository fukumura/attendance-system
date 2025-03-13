import express from 'express';
import { leaveController } from '../controllers/leaveController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// すべてのルートで認証が必要
router.use(authenticate);

// 休暇申請作成
router.post('/', leaveController.createLeave);

// 休暇申請一覧取得
router.get('/', leaveController.getLeaves);

// 休暇申請詳細取得
router.get('/:id', leaveController.getLeave);

// 休暇申請更新
router.put('/:id', leaveController.updateLeave);

// 休暇申請ステータス更新（管理者のみ）
router.put('/:id/status', requireAdmin, leaveController.updateStatus);

export default router;
