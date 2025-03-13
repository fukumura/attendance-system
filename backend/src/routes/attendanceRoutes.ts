import express from 'express';
import { attendanceController } from '../controllers/attendanceController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// すべてのルートで認証が必要
router.use(authenticate);

// 出勤打刻
router.post('/clock-in', attendanceController.clockIn);

// 退勤打刻
router.post('/clock-out', attendanceController.clockOut);

// 今日の勤怠状態取得
router.get('/today', attendanceController.getToday);

// 勤怠記録一覧取得
router.get('/records', attendanceController.getRecords);

// 勤務時間サマリー取得
router.get('/summary', attendanceController.getSummary);

export default router;
