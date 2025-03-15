import { leaveController } from '../../src/controllers/leaveController';
import { mockRequest, mockResponse, prismaMock } from '../utils/testUtils';

describe('Leave Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLeave', () => {
    it('should create a leave request successfully', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          startDate: '2025-04-01',
          endDate: '2025-04-03',
          reason: 'Family vacation',
          leaveType: 'PAID',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      const mockLeaveRequest = {
        id: 'leave-request-id',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-03'),
        reason: 'Family vacation',
        leaveType: 'PAID',
        status: 'PENDING',
        userId: 'user-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.leaveRequest.create.mockResolvedValue(mockLeaveRequest as any);

      // Act
      await leaveController.createLeave(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.create).toHaveBeenCalledWith({
        data: {
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-04-03'),
          reason: 'Family vacation',
          leaveType: 'PAID',
          status: 'PENDING',
          userId: 'user-id-1',
        },
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockLeaveRequest,
      });
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          // Missing startDate
          endDate: '2025-04-03',
          reason: 'Family vacation',
          leaveType: 'PAID',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      // Act
      await leaveController.createLeave(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String), // Validation error message
      });
    });

    it('should return 400 if end date is before start date', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          startDate: '2025-04-03',
          endDate: '2025-04-01', // Before start date
          reason: 'Family vacation',
          leaveType: 'PAID',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      // Act
      await leaveController.createLeave(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.stringContaining('開始日は終了日より前である必要があります'),
      });
    });
  });

  describe('getLeaves', () => {
    it('should return user leave requests with pagination', async () => {
      // Arrange
      const req = mockRequest({
        query: {},
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      const mockLeaveRequests = [
        {
          id: 'leave-request-id-1',
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-04-03'),
          reason: 'Family vacation',
          leaveType: 'PAID',
          status: 'APPROVED',
          userId: 'user-id-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-id-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        {
          id: 'leave-request-id-2',
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-05-02'),
          reason: 'Medical appointment',
          leaveType: 'SICK',
          status: 'PENDING',
          userId: 'user-id-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-id-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      prismaMock.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests as any);
      prismaMock.leaveRequest.count.mockResolvedValue(2);

      // Act
      await leaveController.getLeaves(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id-1',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: 0,
        take: 10,
      });

      expect(prismaMock.leaveRequest.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-id-1',
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          leaves: mockLeaveRequests,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      });
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      const req = mockRequest({
        query: {
          page: '2',
          limit: '5',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      const mockLeaveRequests = [
        {
          id: 'leave-request-id-3',
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-06-03'),
          reason: 'Personal leave',
          leaveType: 'OTHER',
          status: 'PENDING',
          userId: 'user-id-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-id-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      prismaMock.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests as any);
      prismaMock.leaveRequest.count.mockResolvedValue(6);

      // Act
      await leaveController.getLeaves(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id-1',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: 5, // (page - 1) * limit
        take: 5,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          leaves: mockLeaveRequests,
          pagination: {
            page: 2,
            limit: 5,
            total: 6,
            totalPages: 2,
          },
        },
      });
    });

    it('should filter by status if provided', async () => {
      // Arrange
      const req = mockRequest({
        query: {
          status: 'APPROVED',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      const mockLeaveRequests = [
        {
          id: 'leave-request-id-1',
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-04-03'),
          reason: 'Family vacation',
          leaveType: 'PAID',
          status: 'APPROVED',
          userId: 'user-id-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-id-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      prismaMock.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests as any);
      prismaMock.leaveRequest.count.mockResolvedValue(1);

      // Act
      await leaveController.getLeaves(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id-1',
          status: 'APPROVED',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: 0,
        take: 10,
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getLeave', () => {
    it('should return a leave request by ID', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      const mockLeaveRequest = {
        id: 'leave-request-id-1',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-03'),
        reason: 'Family vacation',
        leaveType: 'PAID',
        status: 'APPROVED',
        userId: 'user-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-id-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      prismaMock.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest as any);

      // Act
      await leaveController.getLeave(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'leave-request-id-1',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockLeaveRequest,
      });
    });

    it('should return 404 if leave request not found', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'non-existent-id',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      prismaMock.leaveRequest.findUnique.mockResolvedValue(null);

      // Act
      await leaveController.getLeave(req, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '休暇申請が見つかりません',
      });
    });

    it('should return 403 if user tries to access another user\'s leave request', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        user: {
          id: 'user-id-2', // Different user
          role: 'EMPLOYEE',
        },
      });

      const res = mockResponse();

      const mockLeaveRequest = {
        id: 'leave-request-id-1',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-03'),
        reason: 'Family vacation',
        leaveType: 'PAID',
        status: 'APPROVED',
        userId: 'user-id-1', // Different from requester
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-id-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      prismaMock.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest as any);

      // Act
      await leaveController.getLeave(req, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'この休暇申請にアクセスする権限がありません',
      });
    });

    it('should allow admin to access any leave request', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        user: {
          id: 'admin-id',
          role: 'ADMIN', // Admin user
        },
      });

      const res = mockResponse();

      const mockLeaveRequest = {
        id: 'leave-request-id-1',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-03'),
        reason: 'Family vacation',
        leaveType: 'PAID',
        status: 'APPROVED',
        userId: 'user-id-1', // Different from requester
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-id-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      prismaMock.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest as any);

      // Act
      await leaveController.getLeave(req, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockLeaveRequest,
      });
    });
  });

  describe('updateLeave', () => {
    it('should update a leave request successfully', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          reason: 'Updated reason',
          leaveType: 'OTHER',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-03'),
        reason: 'Family vacation',
        leaveType: 'PAID',
        status: 'PENDING',
        userId: 'user-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLeaveRequest = {
        ...existingLeaveRequest,
        reason: 'Updated reason',
        leaveType: 'OTHER',
        updatedAt: new Date(),
      };

      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);
      prismaMock.leaveRequest.update.mockResolvedValue(updatedLeaveRequest as any);

      // Act
      await leaveController.updateLeave(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'leave-request-id-1',
        },
      });

      expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'leave-request-id-1',
        },
        data: {
          reason: 'Updated reason',
          leaveType: 'OTHER',
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: updatedLeaveRequest,
      });
    });

    it('should return 404 if leave request not found', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'non-existent-id',
        },
        body: {
          reason: 'Updated reason',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      prismaMock.leaveRequest.findUnique.mockResolvedValue(null);

      // Act
      await leaveController.updateLeave(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '休暇申請が見つかりません',
      });
    });

    it('should return 403 if user tries to update another user\'s leave request', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          reason: 'Updated reason',
        },
        user: {
          id: 'user-id-2', // Different user
          role: 'EMPLOYEE',
        },
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-03'),
        reason: 'Family vacation',
        leaveType: 'PAID',
        status: 'PENDING',
        userId: 'user-id-1', // Different from requester
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);

      // Act
      await leaveController.updateLeave(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'この休暇申請を更新する権限がありません',
      });
    });

    it('should return 400 if trying to update an approved or rejected leave request', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          reason: 'Updated reason',
        },
        user: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-03'),
        reason: 'Family vacation',
        leaveType: 'PAID',
        status: 'APPROVED', // Already approved
        userId: 'user-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);

      // Act
      await leaveController.updateLeave(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '承認済み・却下済みの申請は更新できません',
      });
    });
  });

  describe('updateStatus', () => {
    it('should update leave request status successfully as admin', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          status: 'APPROVED',
          comment: 'Approved by admin',
        },
        user: {
          id: 'admin-id',
          role: 'ADMIN',
        },
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-03'),
        reason: 'Family vacation',
        leaveType: 'PAID',
        status: 'PENDING',
        userId: 'user-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLeaveRequest = {
        ...existingLeaveRequest,
        status: 'APPROVED',
        comment: 'Approved by admin',
        updatedAt: new Date(),
      };

      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);
      prismaMock.leaveRequest.update.mockResolvedValue(updatedLeaveRequest as any);

      // Act
      await leaveController.updateStatus(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'leave-request-id-1',
        },
      });

      expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'leave-request-id-1',
        },
        data: {
          status: 'APPROVED',
          comment: 'Approved by admin',
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: updatedLeaveRequest,
      });
    });

    it('should return 403 if non-admin tries to update status', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          status: 'APPROVED',
        },
        user: {
          id: 'user-id-1',
          role: 'EMPLOYEE', // Non-admin
        },
      });

      const res = mockResponse();

      // Act
      await leaveController.updateStatus(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '管理者権限が必要です',
      });
    });

    it('should return 404 if leave request not found', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'non-existent-id',
        },
        body: {
          status: 'APPROVED',
        },
        user: {
          id: 'admin-id',
          role: 'ADMIN',
        },
      });

      const res = mockResponse();

      prismaMock.leaveRequest.findUnique.mockResolvedValue(null);

      // Act
      await leaveController.updateStatus(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '休暇申請が見つかりません',
      });
    });

    it('should return 400 if trying to update an already processed leave request', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          status: 'APPROVED',
        },
        user: {
          id: 'admin-id',
          role: 'ADMIN',
        },
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-03'),
        reason: 'Family vacation',
        leaveType: 'PAID',
        status: 'REJECTED', // Already processed
        userId: 'user-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);

      // Act
      await leaveController.updateStatus(req, res as any);

      // Assert
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '既に処理済みの申請です',
      });
    });
  });
});
