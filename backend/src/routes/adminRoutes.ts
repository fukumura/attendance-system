import express from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware';

const router = express.Router();

// すべてのルートで認証と管理者権限を要求
router.use(authenticate, requireAdmin);

// ユーザー管理API
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

export default router;
