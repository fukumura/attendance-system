import { prismaMock } from '../utils/testUtils';
import { mockRequest, mockAdminRequest, mockResponse } from '../utils/testUtils';
import { reportController } from '../../src/controllers/reportController';

// モジュールのモック化
jest.mock('../../src/app', () => ({
  prisma: prismaMock,
}));

describe('Report Controller', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserReport', () => {
    it('should return 401 if user is not authenticated', async () => {
      // 認証されていないリクエスト
      const req = mockRequest({
        user: undefined,
        params: { userId: 'user-123' },
        query: { year: '2025', month: '3' }
      });
      const res = mockResponse();

      await reportController.getUserReport(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です',
      });
    });

    it('should return 403 if non-admin user tries to access other user report', async () => {
      // 一般ユーザーが他のユーザーのレポートにアクセス
      const req = mockRequest({
        user: { id: 'user-123', role: 'USER' },
        params: { userId: 'other-user-456' },
        query: { year: '2025', month: '3' }
      });
      const res = mockResponse();

      await reportController.getUserReport(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '他のユーザーのレポートを取得する権限がありません',
      });
    });

    it('should return 400 if year or month is missing', async () => {
      // 自分自身のレポートにアクセスするケース（権限チェックをパスする）
      const req = mockRequest({
        user: { id: 'user-123', role: 'USER' },
        params: { userId: 'user-123' }, // 同じユーザーID
        query: { year: '2025' } // monthが欠けている
      });
      const res = mockResponse();

      await reportController.getUserReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '年と月は必須です',
      });
    });

    it('should return 404 if user is not found', async () => {
      // 自分自身のレポートにアクセスするケース（権限チェックをパスする）
      const req = mockRequest({
        user: { id: 'user-123', role: 'USER' },
        params: { userId: 'user-123' }, // 同じユーザーID
        query: { year: '2025', month: '3' }
      });
      const res = mockResponse();

      // ユーザーが見つからない場合のモック
      prismaMock.user.findUnique.mockResolvedValue(null);

      await reportController.getUserReport(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { id: true, name: true, email: true }
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザーが見つかりません',
      });
    });

    it('should return user report successfully', async () => {
      // 自分自身のレポートにアクセスするケース
      const req = mockRequest({
        user: { id: 'user-123', role: 'USER' },
        params: { userId: 'user-123' }, // 同じユーザーID
        query: { year: '2025', month: '3' }
      });
      const res = mockResponse();

      // モックデータの設定
      const mockUser = {
        id: 'user-123',
        name: 'テストユーザー',
        email: 'test@example.com',
      };

      const mockAttendanceRecords = [
        {
          id: 'attendance-1',
          userId: 'user-123',
          date: new Date('2025-03-01'),
          clockInTime: new Date('2025-03-01T09:00:00'),
          clockOutTime: new Date('2025-03-01T18:00:00'),
          notes: 'テスト備考',
        }
      ];

      const mockLeaveRequests = [
        {
          id: 'leave-1',
          userId: 'user-123',
          startDate: new Date('2025-03-15'),
          endDate: new Date('2025-03-15'),
          leaveType: 'PAID',
          reason: 'テスト休暇',
          status: 'APPROVED',
          comment: null,
        }
      ];

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.attendanceRecord.findMany.mockResolvedValue(mockAttendanceRecords as any);
      prismaMock.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests as any);

      await reportController.getUserReport(req, res);

      expect(prismaMock.user.findUnique).toHaveBeenCalled();
      expect(prismaMock.attendanceRecord.findMany).toHaveBeenCalled();
      expect(prismaMock.leaveRequest.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          user: mockUser,
          period: expect.objectContaining({
            year: 2025,
            month: 3
          }),
          attendance: expect.objectContaining({
            totalWorkingDays: 1,
            records: mockAttendanceRecords
          }),
          leave: expect.objectContaining({
            totalLeaveDays: 1,
            requests: mockLeaveRequests
          })
        })
      });
    });

    it('should handle server errors', async () => {
      // 自分自身のレポートにアクセスするケース（権限チェックをパスする）
      const req = mockRequest({
        user: { id: 'user-123', role: 'USER' },
        params: { userId: 'user-123' }, // 同じユーザーID
        query: { year: '2025', month: '3' }
      });
      const res = mockResponse();

      const mockError = new Error('Database error');
      prismaMock.user.findUnique.mockRejectedValue(mockError);

      // コンソールエラーをモックして出力を抑制
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await reportController.getUserReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'レポートの取得中にエラーが発生しました'
      });
    });
  });

  describe('getDepartmentReport', () => {
    it('should return 401 if user is not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        query: { year: '2025', month: '3' }
      });
      const res = mockResponse();

      await reportController.getDepartmentReport(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です',
      });
    });

    it('should return 403 if non-admin user tries to access department report', async () => {
      const req = mockRequest({
        user: { id: 'user-123', role: 'USER' },
        query: { year: '2025', month: '3' }
      });
      const res = mockResponse();

      await reportController.getDepartmentReport(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '管理者権限が必要です',
      });
    });

    it('should return 400 if year or month is missing', async () => {
      const req = mockAdminRequest({
        query: { year: '2025' } // monthが欠けている
      });
      const res = mockResponse();

      await reportController.getDepartmentReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '年と月は必須です',
      });
    });

    it('should return department report successfully', async () => {
      const req = mockAdminRequest({
        query: { year: '2025', month: '3' }
      });
      const res = mockResponse();

      // モックデータの設定
      const mockUsers = [
        {
          id: 'user-1',
          name: 'ユーザー1',
          email: 'user1@example.com',
          role: 'USER'
        },
        {
          id: 'user-2',
          name: 'ユーザー2',
          email: 'user2@example.com',
          role: 'USER'
        }
      ];

      const mockAttendanceRecords = [
        {
          id: 'attendance-1',
          userId: 'user-1',
          date: new Date('2025-03-01'),
          clockInTime: new Date('2025-03-01T09:00:00'),
          clockOutTime: new Date('2025-03-01T18:00:00'),
          user: { id: 'user-1', name: 'ユーザー1' }
        }
      ];

      const mockLeaveRequests = [
        {
          id: 'leave-1',
          userId: 'user-2',
          startDate: new Date('2025-03-15'),
          endDate: new Date('2025-03-15'),
          leaveType: 'PAID',
          status: 'APPROVED',
          user: { id: 'user-2', name: 'ユーザー2' }
        }
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
      prismaMock.attendanceRecord.findMany.mockResolvedValue(mockAttendanceRecords as any);
      prismaMock.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests as any);

      await reportController.getDepartmentReport(req, res);

      expect(prismaMock.user.findMany).toHaveBeenCalled();
      expect(prismaMock.attendanceRecord.findMany).toHaveBeenCalled();
      expect(prismaMock.leaveRequest.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          period: expect.objectContaining({
            year: 2025,
            month: 3
          }),
          departmentSummary: expect.objectContaining({
            totalUsers: 2
          }),
          userReports: expect.arrayContaining([
            expect.objectContaining({
              user: expect.objectContaining({
                id: expect.any(String)
              })
            })
          ])
        })
      });
    });
  });

  describe('exportReport', () => {
    it('should return 401 if user is not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        query: {
          userId: 'user-123',
          year: '2025',
          month: '3',
          type: 'attendance'
        }
      });
      const res = mockResponse();

      await reportController.exportReport(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です',
      });
    });

    it('should return 400 if required parameters are missing', async () => {
      const req = mockRequest({
        query: {
          userId: 'user-123',
          year: '2025',
          // monthが欠けている
          type: 'attendance'
        }
      });
      const res = mockResponse();

      await reportController.exportReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザーID、年、月、タイプは必須です',
      });
    });

    it('should return 403 if non-admin user tries to export other user report', async () => {
      const req = mockRequest({
        user: { id: 'user-123', role: 'USER' },
        query: {
          userId: 'other-user-456', // 異なるユーザーID
          year: '2025',
          month: '3',
          type: 'attendance'
        }
      });
      const res = mockResponse();

      await reportController.exportReport(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '他のユーザーのレポートをエクスポートする権限がありません',
      });
    });

    it('should return 404 if user is not found', async () => {
      const req = mockAdminRequest({
        query: {
          userId: 'non-existent-user',
          year: '2025',
          month: '3',
          type: 'attendance'
        }
      });
      const res = mockResponse();

      prismaMock.user.findUnique.mockResolvedValue(null);

      await reportController.exportReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザーが見つかりません',
      });
    });

    it('should return 400 if type is invalid', async () => {
      // 自分自身のレポートにアクセスするケース（権限チェックをパスする）
      const req = mockRequest({
        user: { id: 'user-123', role: 'USER' },
        query: {
          userId: 'user-123', // 同じユーザーID
          year: '2025',
          month: '3',
          type: 'invalid-type'
        }
      });
      const res = mockResponse();

      const mockUser = {
        id: 'user-123',
        name: 'テストユーザー',
        email: 'test@example.com'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      await reportController.exportReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'タイプは attendance または leave である必要があります',
      });
    });
  });
});