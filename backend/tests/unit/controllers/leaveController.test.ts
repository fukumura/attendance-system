import { mockRequest, mockAdminRequest, mockResponse, prismaMock } from '../../utils/testUtils';
import { leaveController } from '../../../src/controllers/leaveController';
import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Set up a fixed date for testing
const mockDate = new Date('2025-04-01T09:00:00Z');
jest.useFakeTimers().setSystemTime(mockDate);

describe('Leave Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLeave', () => {
    it('should create a new leave request successfully', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          startDate: '2025-04-10',
          endDate: '2025-04-12',
          leaveType: 'PAID',
          reason: 'Family vacation',
        },
      });

      const res = mockResponse();

      const mockLeaveRequest = {
        id: 'leave-request-id',
        userId: req.user?.id,
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'PENDING',
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the create to return the new leave request
      prismaMock.leaveRequest.create.mockResolvedValue(mockLeaveRequest as any);

      // Act
      await leaveController.createLeave(req, res);

      // Assert
      expect(prismaMock.leaveRequest.create).toHaveBeenCalledWith({
        data: {
          userId: req.user?.id,
          startDate: new Date('2025-04-10'),
          endDate: new Date('2025-04-12'),
          leaveType: 'PAID',
          reason: 'Family vacation',
          status: 'PENDING',
        },
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockLeaveRequest,
      });
    });

    it('should return 400 if end date is before start date', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          startDate: '2025-04-12',
          endDate: '2025-04-10', // End date before start date
          leaveType: 'PAID',
          reason: 'Family vacation',
        },
      });

      const res = mockResponse();

      // Act
      await leaveController.createLeave(req, res);

      // Assert
      expect(prismaMock.leaveRequest.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '開始日は終了日より前である必要があります',
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req = mockRequest({
        user: undefined,
        body: {
          startDate: '2025-04-10',
          endDate: '2025-04-12',
          leaveType: 'PAID',
          reason: 'Family vacation',
        },
      });

      const res = mockResponse();

      // Act
      await leaveController.createLeave(req, res);

      // Assert
      expect(prismaMock.leaveRequest.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          startDate: '2025-04-10',
          endDate: '2025-04-12',
          leaveType: 'INVALID_TYPE', // Invalid leave type
          reason: 'Family vacation',
        },
      });

      const res = mockResponse();

      // Act
      await leaveController.createLeave(req, res);

      // Assert
      expect(prismaMock.leaveRequest.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String), // Validation error message
      });
    });

    it('should handle server errors', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          startDate: '2025-04-10',
          endDate: '2025-04-12',
          leaveType: 'PAID',
          reason: 'Family vacation',
        },
      });

      const res = mockResponse();

      // Mock the create to throw an error
      prismaMock.leaveRequest.create.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await leaveController.createLeave(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '休暇申請の作成中にエラーが発生しました',
      });
    });
  });

  describe('getLeaves', () => {
    it('should return leave requests for the user', async () => {
      // Arrange
      const req = mockRequest({
        query: {
          status: 'PENDING',
        },
      });

      const res = mockResponse();

      const mockLeaveRequests = [
        {
          id: 'leave-request-id-1',
          userId: req.user?.id,
          startDate: new Date('2025-04-10'),
          endDate: new Date('2025-04-12'),
          leaveType: 'PAID',
          reason: 'Family vacation',
          status: 'PENDING',
          comment: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'leave-request-id-2',
          userId: req.user?.id,
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-05-03'),
          leaveType: 'PAID',
          reason: 'Personal time',
          status: 'PENDING',
          comment: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the findMany to return leave requests
      prismaMock.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests as any);
      // Mock the count to return the total
      prismaMock.leaveRequest.count.mockResolvedValue(2);

      // Act
      await leaveController.getLeaves(req, res);

      // Assert
      expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: req.user?.id,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
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

    it('should return all leave requests for admin', async () => {
      // Arrange
      const req = mockAdminRequest({
        query: {
          status: 'PENDING',
          userId: 'user-id-1',
        },
      });

      const res = mockResponse();

      const mockLeaveRequests = [
        {
          id: 'leave-request-id-1',
          userId: 'user-id-1',
          startDate: new Date('2025-04-10'),
          endDate: new Date('2025-04-12'),
          leaveType: 'PAID',
          reason: 'Family vacation',
          status: 'PENDING',
          comment: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the findMany to return leave requests
      prismaMock.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests as any);
      // Mock the count to return the total
      prismaMock.leaveRequest.count.mockResolvedValue(1);

      // Act
      await leaveController.getLeaves(req, res);

      // Assert
      expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
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
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          leaves: mockLeaveRequests,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
      });
    });

    it('should handle pagination parameters correctly', async () => {
      // Arrange
      const req = mockRequest({
        query: {
          page: '2',
          limit: '5',
        },
      });

      const res = mockResponse();

      const mockLeaveRequests = [
        {
          id: 'leave-request-id-6',
          userId: req.user?.id,
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-06-03'),
          leaveType: 'PAID',
          reason: 'Personal time',
          status: 'PENDING',
          comment: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the findMany to return leave requests
      prismaMock.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests as any);
      // Mock the count to return the total
      prismaMock.leaveRequest.count.mockResolvedValue(6);

      // Act
      await leaveController.getLeaves(req, res);

      // Assert
      expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: req.user?.id,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: 5, // Page 2 with limit 5
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

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req = mockRequest({
        user: undefined,
        query: {
          status: 'PENDING',
        },
      });

      const res = mockResponse();

      // Act
      await leaveController.getLeaves(req, res);

      // Assert
      expect(prismaMock.leaveRequest.findMany).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です',
      });
    });

    it('should handle server errors', async () => {
      // Arrange
      const req = mockRequest({
        query: {
          status: 'PENDING',
        },
      });

      const res = mockResponse();

      // Mock database error
      prismaMock.leaveRequest.findMany.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await leaveController.getLeaves(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          leaves: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
        warning: expect.any(String),
      });
    });
  });

  describe('getLeave', () => {
    it('should return a leave request by ID', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
      });

      const res = mockResponse();

      const mockLeaveRequest = {
        id: 'leave-request-id-1',
        userId: req.user?.id,
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'PENDING',
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findUnique to return a leave request
      prismaMock.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest as any);

      // Act
      await leaveController.getLeave(req, res);

      // Assert
      expect(prismaMock.leaveRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'leave-request-id-1' },
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
      });

      const res = mockResponse();

      // Mock the findUnique to return null
      prismaMock.leaveRequest.findUnique.mockResolvedValue(null);

      // Act
      await leaveController.getLeave(req, res);

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
      });

      const res = mockResponse();

      const mockLeaveRequest = {
        id: 'leave-request-id-1',
        userId: 'other-user-id', // Different from req.user.id
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'PENDING',
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findUnique to return a leave request
      prismaMock.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest as any);

      // Act
      await leaveController.getLeave(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'この休暇申請にアクセスする権限がありません',
      });
    });

    it('should allow admin to access any leave request', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'leave-request-id-1',
        },
      });

      const res = mockResponse();

      const mockLeaveRequest = {
        id: 'leave-request-id-1',
        userId: 'other-user-id', // Different from req.user.id
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'PENDING',
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findUnique to return a leave request
      prismaMock.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest as any);

      // Act
      await leaveController.getLeave(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockLeaveRequest,
      });
    });

    it('should handle server errors', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
      });

      const res = mockResponse();

      // Mock database error
      prismaMock.leaveRequest.findUnique.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await leaveController.getLeave(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '休暇申請の取得中にエラーが発生しました',
      });
    });
  });

  describe('updateLeaveRequest', () => {
    it('should update a leave request successfully', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          reason: 'Updated reason',
          startDate: '2025-04-15',
          endDate: '2025-04-17',
        },
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        userId: req.user?.id,
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'PENDING',
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLeaveRequest = {
        ...existingLeaveRequest,
        startDate: new Date('2025-04-15'),
        endDate: new Date('2025-04-17'),
        reason: 'Updated reason',
        updatedAt: new Date(),
      };

      // Mock the findUnique to return an existing leave request
      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);
      // Mock the update to return the updated leave request
      prismaMock.leaveRequest.update.mockResolvedValue(updatedLeaveRequest as any);

      // Act
      await leaveController.updateLeave(req, res);

      // Assert
      expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 'leave-request-id-1' },
        data: {
          reason: 'Updated reason',
          startDate: new Date('2025-04-15'),
          endDate: new Date('2025-04-17'),
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
      });

      const res = mockResponse();

      // Mock the findUnique to return null
      prismaMock.leaveRequest.findUnique.mockResolvedValue(null);

      // Act
      await leaveController.updateLeave(req, res);

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
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        userId: 'other-user-id', // Different from req.user.id
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'PENDING',
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findUnique to return a leave request
      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);

      // Act
      await leaveController.updateLeave(req, res);

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
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        userId: req.user?.id,
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'APPROVED', // Already approved
        comment: 'Approved by manager',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findUnique to return a leave request
      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);

      // Act
      await leaveController.updateLeave(req, res);

      // Assert
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '承認済み・却下済みの申請は更新できません',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          startDate: '2025-04-15',
          endDate: '2025-04-10', // End date before start date
        },
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        userId: req.user?.id,
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'PENDING',
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findUnique to return a leave request
      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);

      // Act
      await leaveController.updateLeave(req, res);

      // Assert
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '開始日は終了日より前である必要があります',
      });
    });
  });

  describe('updateLeaveRequestStatus', () => {
    it('should update leave request status as admin', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          status: 'APPROVED',
          comment: 'Approved by manager',
        },
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        userId: 'user-id-1',
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'PENDING',
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLeaveRequest = {
        ...existingLeaveRequest,
        status: 'APPROVED',
        comment: 'Approved by manager',
        updatedAt: new Date(),
      };

      // Mock the findUnique to return an existing leave request
      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);
      // Mock the update to return the updated leave request
      prismaMock.leaveRequest.update.mockResolvedValue(updatedLeaveRequest as any);

      // Act
      await leaveController.updateStatus(req, res);

      // Assert
      expect(prismaMock.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 'leave-request-id-1' },
        data: {
          status: 'APPROVED',
          comment: 'Approved by manager',
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
          comment: 'Approved',
        },
      });

      const res = mockResponse();

      // Act
      await leaveController.updateStatus(req, res);

      // Assert
      expect(prismaMock.leaveRequest.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '管理者権限が必要です',
      });
    });

    it('should return 404 if leave request not found', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'non-existent-id',
        },
        body: {
          status: 'APPROVED',
          comment: 'Approved by manager',
        },
      });

      const res = mockResponse();

      // Mock the findUnique to return null
      prismaMock.leaveRequest.findUnique.mockResolvedValue(null);

      // Act
      await leaveController.updateStatus(req, res);

      // Assert
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '休暇申請が見つかりません',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          status: 'INVALID_STATUS', // Invalid status
          comment: 'Approved by manager',
        },
      });

      const res = mockResponse();

      // Act
      await leaveController.updateStatus(req, res);

      // Assert
      expect(prismaMock.leaveRequest.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.leaveRequest.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String), // Validation error message
      });
    });

    it('should handle server errors', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'leave-request-id-1',
        },
        body: {
          status: 'APPROVED',
          comment: 'Approved by manager',
        },
      });

      const res = mockResponse();

      const existingLeaveRequest = {
        id: 'leave-request-id-1',
        userId: 'user-id-1',
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-12'),
        leaveType: 'PAID',
        reason: 'Family vacation',
        status: 'PENDING',
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findUnique to return an existing leave request
      prismaMock.leaveRequest.findUnique.mockResolvedValue(existingLeaveRequest as any);
      // Mock the update to throw an error
      prismaMock.leaveRequest.update.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await leaveController.updateStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '休暇申請ステータスの更新中にエラーが発生しました',
      });
    });
  });
});
