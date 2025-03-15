import express from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// 基本的な管理者ルートには認証と管理者権限を要求
router.use(authenticate);

// ユーザー管理API（管理者権限が必要）
router.get('/users', requireAdmin, adminController.getUsers);
router.get('/users/:id', requireAdmin, adminController.getUser);
router.post('/users', requireAdmin, adminController.createUser);
router.put('/users/:id', requireAdmin, adminController.updateUser);
router.delete('/users/:id', requireAdmin, adminController.deleteUser);

// スーパー管理者専用API
router.post('/super-admins', requireSuperAdmin, adminController.createSuperAdmin);

export default router;
