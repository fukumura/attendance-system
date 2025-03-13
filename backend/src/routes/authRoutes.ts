import express from 'express';
import { authController } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// ユーザー登録（管理者のみ実行可能）
router.post('/register', authenticate, requireAdmin, authController.register);

// ログイン
router.post('/login', authController.login);

// 現在のユーザー情報取得
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
