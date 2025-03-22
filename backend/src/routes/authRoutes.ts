import express from 'express';
import { authController } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';
import { emailService } from '../services/emailService';

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

// テスト用メール送信エンドポイント
router.post('/test-email', async (req, res) => {
  try {
    console.log('テストメール送信リクエスト受信:', req.body);
    
    const result = await emailService.sendEmail({
      to: req.body.email || 'test@example.com',
      subject: 'ポケット勤怠 - テストメール',
      text: 'これはAmazon SESのテストメールです。メール送信システムが正常に機能していることを確認するためのテストです。'
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'テストメールが送信されました',
      result
    });
  } catch (error) {
    console.error('テストメール送信エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: 'テストメール送信中にエラーが発生しました',
      error: String(error),
      stack: error.stack
    });
  }
});