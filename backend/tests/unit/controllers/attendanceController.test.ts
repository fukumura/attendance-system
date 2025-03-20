import { mockRequest, mockAdminRequest, mockResponse, prismaMock } from '../../utils/testUtils';
import { attendanceController } from '../../../src/controllers/attendanceController';
import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Set up a fixed date for testing
const mockDate = new Date('2025-04-01T09:00:00Z');
jest.useFakeTimers().setSystemTime(mockDate);

describe('Attendance Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clockIn', () => {
    it('should create a new attendance record when clocking in', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          location: 'Office',
          notes: 'Working from office today',
        },
      });

      const res = mockResponse();

      const mockAttendanceRecord = {
        id: 'attendance-id',
        userId: req.user?.id,
        date: new Date('2025-04-01'),
        clockInTime: new Date('2025-04-01T09:00:00Z'),
        clockOutTime: null,
        notes: 'Working from office today',
        location: 'Office',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findFirst to return null (no existing record for today)
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(null);
      // Mock the create to return the new record
      prismaMock.attendanceRecord.create.mockResolvedValue(mockAttendanceRecord as any);

      // Act
      await attendanceController.clockIn(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: req.user?.id,
          }),
        })
      );

      expect(prismaMock.attendanceRecord.create).toHaveBeenCalledWith({
        data: {
          userId: req.user?.id,
          date: expect.any(Date),
          clockInTime: expect.any(Date),
          notes: 'Working from office today',
          location: 'Office',
        },
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockAttendanceRecord,
      });
    });

    it('should return 400 if already clocked in today', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          location: 'Office',
          notes: 'Working from office today',
        },
      });

      const res = mockResponse();

      const existingRecord = {
        id: 'attendance-id',
        userId: req.user?.id,
        date: new Date('2025-04-01'),
        clockInTime: new Date('2025-04-01T08:00:00Z'),
        clockOutTime: null,
        notes: 'Already clocked in',
        location: 'Office',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findFirst to return an existing record
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(existingRecord as any);

      // Act
      await attendanceController.clockIn(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '既に今日の出勤記録が存在します',
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req = mockRequest({
        user: undefined,
        body: {
          location: 'Office',
          notes: 'Working from office today',
        },
      });

      const res = mockResponse();

      // Act
      await attendanceController.clockIn(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.attendanceRecord.create).not.toHaveBeenCalled();
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
          // Invalid location type
          location: 123,
          notes: 'Working from office today',
        },
      });

      const res = mockResponse();

      // Act
      await attendanceController.clockIn(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.attendanceRecord.create).not.toHaveBeenCalled();
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
          location: 'Office',
          notes: 'Working from office today',
        },
      });

      const res = mockResponse();

      // Mock the findFirst to return null
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(null);
      // Mock the create to throw an error
      prismaMock.attendanceRecord.create.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await attendanceController.clockIn(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '出勤打刻中にエラーが発生しました',
      });
    });
  });

  describe('clockOut', () => {
    it('should update attendance record when clocking out', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          notes: 'Completed tasks for today',
        },
      });

      const res = mockResponse();

      const existingRecord = {
        id: 'attendance-id',
        userId: req.user?.id,
        date: new Date('2025-04-01'),
        clockInTime: new Date('2025-04-01T09:00:00Z'),
        clockOutTime: null,
        notes: 'Working from office today',
        location: 'Office',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedRecord = {
        ...existingRecord,
        clockOutTime: new Date('2025-04-01T18:00:00Z'),
        notes: 'Completed tasks for today',
      };

      // Mock the findFirst to return an existing record
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(existingRecord as any);
      // Mock the update to return the updated record
      prismaMock.attendanceRecord.update.mockResolvedValue(updatedRecord as any);

      // Act
      await attendanceController.clockOut(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: req.user?.id,
          }),
        })
      );

      expect(prismaMock.attendanceRecord.update).toHaveBeenCalledWith({
        where: { id: 'attendance-id' },
        data: {
          clockOutTime: mockDate,
          notes: 'Completed tasks for today',
          location: 'Office', // Preserve existing location
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: updatedRecord,
      });
    });

    it('should return 404 if not clocked in today', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          notes: 'Completed tasks for today',
        },
      });

      const res = mockResponse();

      // Mock the findFirst to return null (no existing record for today)
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(null);

      // Act
      await attendanceController.clockOut(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '今日の出勤記録が見つかりません',
      });
    });

    it('should return 400 if already clocked out today', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          notes: 'Completed tasks for today',
        },
      });

      const res = mockResponse();

      const existingRecord = {
        id: 'attendance-id',
        userId: req.user?.id,
        date: new Date('2025-04-01'),
        clockInTime: new Date('2025-04-01T09:00:00Z'),
        clockOutTime: new Date('2025-04-01T17:00:00Z'), // Already clocked out
        notes: 'Already clocked out',
        location: 'Office',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findFirst to return an existing record with clockOutTime
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(existingRecord as any);

      // Act
      await attendanceController.clockOut(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '既に退勤打刻が完了しています',
      });
    });

    it('should handle server errors', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          notes: 'Completed tasks for today',
        },
      });

      const res = mockResponse();

      const existingRecord = {
        id: 'attendance-id',
        userId: req.user?.id,
        date: new Date('2025-04-01'),
        clockInTime: new Date('2025-04-01T09:00:00Z'),
        clockOutTime: null,
        notes: 'Working from office today',
        location: 'Office',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findFirst to return an existing record
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(existingRecord as any);
      // Mock the update to throw an error
      prismaMock.attendanceRecord.update.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await attendanceController.clockOut(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '退勤打刻中にエラーが発生しました',
      });
    });
  });

  describe('getToday', () => {
    it('should return current attendance status when clocked in but not out', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();

      const existingRecord = {
        id: 'attendance-id',
        userId: req.user?.id,
        date: new Date('2025-04-01'),
        clockInTime: new Date('2025-04-01T09:00:00Z'),
        clockOutTime: null,
        notes: 'Working from office today',
        location: 'Office',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database connection test
      prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);
      // Mock the findFirst to return an existing record
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(existingRecord as any);

      // Act
      await attendanceController.getToday(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: req.user?.id,
          }),
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          isClockedIn: true,
          isClockedOut: false,
          record: existingRecord,
        },
      });
    });

    it('should return current attendance status when clocked in and out', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();

      const existingRecord = {
        id: 'attendance-id',
        userId: req.user?.id,
        date: new Date('2025-04-01'),
        clockInTime: new Date('2025-04-01T09:00:00Z'),
        clockOutTime: new Date('2025-04-01T17:00:00Z'),
        notes: 'Completed work',
        location: 'Office',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database connection test
      prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);
      // Mock the findFirst to return an existing record with clockOutTime
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(existingRecord as any);

      // Act
      await attendanceController.getToday(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          isClockedIn: true,
          isClockedOut: true,
          record: existingRecord,
        },
      });
    });

    it('should return current attendance status when not clocked in', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();

      // Mock database connection test
      prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);
      // Mock the findFirst to return null (no record for today)
      prismaMock.attendanceRecord.findFirst.mockResolvedValue(null);

      // Act
      await attendanceController.getToday(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          isClockedIn: false,
          isClockedOut: false,
          record: null,
        },
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req = mockRequest({
        user: undefined,
      });

      const res = mockResponse();

      // Act
      await attendanceController.getToday(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findFirst).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です',
      });
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();

      // Mock database error
      prismaMock.attendanceRecord.findFirst.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await attendanceController.getToday(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '勤怠状態の取得中にエラーが発生しました',
        details: expect.stringContaining('Database error'),
      });
    });
  });

  describe('getRecords', () => {
    it('should return attendance records for the user', async () => {
      // Arrange
      const req = mockRequest({
        query: {
          startDate: '2025-04-01',
          endDate: '2025-04-30',
        },
      });

      const res = mockResponse();

      const mockRecords = [
        {
          id: 'attendance-id-1',
          userId: req.user?.id,
          date: new Date('2025-04-01'),
          clockInTime: new Date('2025-04-01T09:00:00Z'),
          clockOutTime: new Date('2025-04-01T18:00:00Z'),
          notes: 'Regular day',
          location: 'Office',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'attendance-id-2',
          userId: req.user?.id,
          date: new Date('2025-04-02'),
          clockInTime: new Date('2025-04-02T08:30:00Z'),
          clockOutTime: new Date('2025-04-02T17:30:00Z'),
          notes: 'Early start',
          location: 'Office',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the findMany to return records
      prismaMock.attendanceRecord.findMany.mockResolvedValue(mockRecords as any);
      // Mock the count to return the total
      prismaMock.attendanceRecord.count.mockResolvedValue(2);

      // Act
      await attendanceController.getRecords(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: req.user?.id,
          date: expect.any(Object),
        }),
        orderBy: { date: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          records: mockRecords,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      });
    });

    it('should handle pagination parameters correctly', async () => {
      // Arrange
      const req = mockRequest({
        query: {
          startDate: '2025-04-01',
          endDate: '2025-04-30',
          page: '2',
          limit: '5',
        },
      });

      const res = mockResponse();

      const mockRecords = [
        {
          id: 'attendance-id-6',
          userId: req.user?.id,
          date: new Date('2025-04-06'),
          clockInTime: new Date('2025-04-06T09:00:00Z'),
          clockOutTime: new Date('2025-04-06T18:00:00Z'),
          notes: 'Regular day',
          location: 'Office',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the findMany to return records
      prismaMock.attendanceRecord.findMany.mockResolvedValue(mockRecords as any);
      // Mock the count to return the total
      prismaMock.attendanceRecord.count.mockResolvedValue(6);

      // Act
      await attendanceController.getRecords(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: { date: 'desc' },
        skip: 5, // Page 2 with limit 5
        take: 5,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          records: mockRecords,
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
          startDate: '2025-04-01',
          endDate: '2025-04-30',
        },
      });

      const res = mockResponse();

      // Act
      await attendanceController.getRecords(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findMany).not.toHaveBeenCalled();
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
          startDate: '2025-04-01',
          endDate: '2025-04-30',
        },
      });

      const res = mockResponse();

      // Mock database error
      prismaMock.attendanceRecord.findMany.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await attendanceController.getRecords(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '勤怠記録の取得中にエラーが発生しました',
      });
    });
  });

  describe('getSummary', () => {
    it('should return attendance summary for the specified date range', async () => {
      // Arrange
      const req = mockRequest({
        query: {
          startDate: '2025-04-01',
          endDate: '2025-04-30',
        },
      });

      const res = mockResponse();

      const mockRecords = [
        {
          id: 'attendance-id-1',
          userId: req.user?.id,
          date: new Date('2025-04-01'),
          clockInTime: new Date('2025-04-01T09:00:00Z'),
          clockOutTime: new Date('2025-04-01T18:00:00Z'), // 9 hours
          notes: 'Regular day',
          location: 'Office',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'attendance-id-2',
          userId: req.user?.id,
          date: new Date('2025-04-02'),
          clockInTime: new Date('2025-04-02T08:30:00Z'),
          clockOutTime: new Date('2025-04-02T17:30:00Z'), // 9 hours
          notes: 'Early start',
          location: 'Office',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the findMany to return records
      prismaMock.attendanceRecord.findMany.mockResolvedValue(mockRecords as any);

      // Act
      await attendanceController.getSummary(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: req.user?.id,
          date: expect.any(Object),
          clockOutTime: { not: null },
        }),
        orderBy: { date: 'asc' },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          totalWorkingHours: 18, // 9 hours * 2 days
          totalWorkingDays: 2,
          averageWorkingHours: 9, // 18 hours / 2 days
          dailyWorkingHours: [
            { date: '2025-04-01', hours: 9 },
            { date: '2025-04-02', hours: 9 },
          ],
        },
      });
    });

    it('should return 400 if date range is not provided', async () => {
      // Arrange
      const req = mockRequest({
        query: {
          // Missing startDate and endDate
        },
      });

      const res = mockResponse();

      // Act
      await attendanceController.getSummary(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findMany).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '開始日と終了日は必須です',
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req = mockRequest({
        user: undefined,
        query: {
          startDate: '2025-04-01',
          endDate: '2025-04-30',
        },
      });

      const res = mockResponse();

      // Act
      await attendanceController.getSummary(req, res);

      // Assert
      expect(prismaMock.attendanceRecord.findMany).not.toHaveBeenCalled();
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
          startDate: '2025-04-01',
          endDate: '2025-04-30',
        },
      });

      const res = mockResponse();

      // Mock database error
      prismaMock.attendanceRecord.findMany.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await attendanceController.getSummary(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '勤務時間サマリーの取得中にエラーが発生しました',
      });
    });
  });
});
