import express from 'express';
import { authController } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// 初期セットアップ（最初の管理者ユーザー作成）
router.post('/setup', authController.setupAdmin);

// ユーザー登録（管理者のみ実行可能）
router.post('/register', authenticate, requireAdmin, authController.register);

// メールアドレス認証
router.post('/verify-email', authController.verifyEmail);

// 認証トークン再送信
router.post('/resend-verification', authController.resendVerification);

// ログイン
router.post('/login', authController.login);

// 現在のユーザー情報取得
router.get('/me', authenticate, authController.getCurrentUser);

// プロフィール更新
router.put('/profile', authenticate, authController.updateProfile);

// パスワード変更
router.put('/password', authenticate, authController.changePassword);

export default router;
