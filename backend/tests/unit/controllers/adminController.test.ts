import { prismaMock } from '../../utils/testUtils';
import { mockRequest, mockAdminRequest, mockSuperAdminRequest, mockResponse } from '../../utils/testUtils';
import { adminController } from '../../../src/controllers/adminController';
import bcrypt from 'bcryptjs';
import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// モジュールのモック化
jest.mock('../../../src/app', () => ({
  prisma: prismaMock,
}));

// bcryptのモック化
jest.mock('bcryptjs');

// Type the mocked functions
const mockedBcrypt = bcrypt as jest.Mocked<any>;

describe('Admin Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSuperAdmin', () => {
    it('should create a super admin successfully', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        body: {
          name: 'Super Admin',
          email: 'superadmin@example.com',
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Mock email check
      prismaMock.user.findFirst.mockResolvedValue(null);

      // Mock user creation
      const mockUser = {
        id: 'super-admin-id',
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'hashed-password',
        role: 'SUPER_ADMIN',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.create.mockResolvedValue(mockUser as any);

      // Act
      await adminController.createSuperAdmin(req, res);

      // Assert
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'superadmin@example.com' },
      });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'superadmin@example.com',
          password: 'hashed-password',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
        },
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          companyId: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should return 403 if requester is not a super admin', async () => {
      // Arrange
      const req = mockAdminRequest({
        body: {
          name: 'Super Admin',
          email: 'superadmin@example.com',
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Act
      await adminController.createSuperAdmin(req, res);

      // Assert
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'スーパー管理者のみがこの操作を実行できます',
      });
    });

    it('should return 400 if email already exists', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        body: {
          name: 'Super Admin',
          email: 'existing@example.com',
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Mock existing user
      const existingUser = {
        id: 'existing-id',
        email: 'existing@example.com',
      };

      prismaMock.user.findFirst.mockResolvedValue(existingUser as any);

      // Act
      await adminController.createSuperAdmin(req, res);

      // Assert
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'このメールアドレスは既に登録されています',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        body: {
          // Missing name
          email: 'superadmin@example.com',
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Act
      await adminController.createSuperAdmin(req, res);

      // Assert
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String), // Validation error message
      });
    });

    it('should handle server errors', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        body: {
          name: 'Super Admin',
          email: 'superadmin@example.com',
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Mock email check
      prismaMock.user.findFirst.mockResolvedValue(null);

      // Mock database error
      prismaMock.user.create.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await adminController.createSuperAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'スーパー管理者作成中にエラーが発生しました',
      });
    });
  });

  describe('getUsers', () => {
    it('should return a list of users with pagination', async () => {
      // Arrange
      const req = mockAdminRequest({
        query: {
          page: '1',
          limit: '10',
        },
      });

      const res = mockResponse();

      // Mock database connection test
      prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);

      // Mock users
      const mockUsers = [
        {
          id: 'user-id-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'EMPLOYEE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-id-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: 'EMPLOYEE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
      prismaMock.user.count.mockResolvedValue(2);

      // Act
      await adminController.getUsers(req, res);

      // Assert
      expect(prismaMock.$queryRaw).toHaveBeenCalled();
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(prismaMock.user.count).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should handle pagination parameters correctly', async () => {
      // Arrange
      const req = mockAdminRequest({
        query: {
          page: '2',
          limit: '5',
        },
      });

      const res = mockResponse();

      // Mock database connection test
      prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);

      // Mock users
      const mockUsers = [
        {
          id: 'user-id-6',
          email: 'user6@example.com',
          name: 'User 6',
          role: 'EMPLOYEE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
      prismaMock.user.count.mockResolvedValue(6);

      // Act
      await adminController.getUsers(req, res);

      // Assert
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        skip: 5, // Page 2 with limit 5
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockUsers,
        pagination: {
          page: 2,
          limit: 5,
          total: 6,
          totalPages: 2,
        },
      });
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const req = mockAdminRequest({
        query: {
          page: '1',
          limit: '10',
        },
      });

      const res = mockResponse();

      // Mock database connection error
      prismaMock.$queryRaw.mockRejectedValue(new Error('Connection error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await adminController.getUsers(req, res);

      // Assert
      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザー一覧の取得中にエラーが発生しました',
        details: expect.stringContaining('Database connection error'),
      });
    });

    it('should handle database query errors', async () => {
      // Arrange
      const req = mockAdminRequest({
        query: {
          page: '1',
          limit: '10',
        },
      });

      const res = mockResponse();

      // Mock database connection test success
      prismaMock.$queryRaw.mockResolvedValue([{ '1': 1 }]);

      // Mock database query error
      prismaMock.user.findMany.mockRejectedValue(new Error('Query error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await adminController.getUsers(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザー一覧の取得中にエラーが発生しました',
        details: expect.stringContaining('Query error'),
      });
    });
  });

  describe('getUser', () => {
    it('should return a user by ID', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      const mockUser = {
        id: 'user-id-1',
        name: 'User 1',
        email: 'user1@example.com',
        role: 'EMPLOYEE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      await adminController.getUser(req, res);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockUser,
      });
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'non-existent-id',
        },
      });

      const res = mockResponse();

      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act
      await adminController.getUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザーが見つかりません',
      });
    });

    it('should handle server errors', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await adminController.getUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザー情報の取得中にエラーが発生しました',
      });
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const req = mockAdminRequest({
        body: {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'EMPLOYEE',
        },
      });

      const res = mockResponse();

      // Mock email check
      prismaMock.user.findFirst.mockResolvedValue(null);

      // Mock user creation
      const mockUser = {
        id: 'new-user-id',
        name: 'New User',
        email: 'newuser@example.com',
        password: 'hashed-password',
        role: 'EMPLOYEE',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.create.mockResolvedValue(mockUser as any);

      // Act
      await adminController.createUser(req, res);

      // Assert
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          password: 'hashed-password',
          name: 'New User',
          role: 'EMPLOYEE',
        },
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          companyId: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should return 400 if email already exists', async () => {
      // Arrange
      const req = mockAdminRequest({
        body: {
          name: 'New User',
          email: 'existing@example.com',
          password: 'password123',
          role: 'EMPLOYEE',
        },
      });

      const res = mockResponse();

      // Mock existing user
      const existingUser = {
        id: 'existing-id',
        email: 'existing@example.com',
      };

      prismaMock.user.findFirst.mockResolvedValue(existingUser as any);

      // Act
      await adminController.createUser(req, res);

      // Assert
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'このメールアドレスは既に登録されています',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockAdminRequest({
        body: {
          // Missing name
          email: 'newuser@example.com',
          password: 'password123',
          role: 'EMPLOYEE',
        },
      });

      const res = mockResponse();

      // Act
      await adminController.createUser(req, res);

      // Assert
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String), // Validation error message
      });
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'user-id-1',
        },
        body: {
          name: 'Updated Name',
          email: 'updated@example.com',
          role: 'ADMIN',
        },
      });

      const res = mockResponse();

      // Mock email check
      prismaMock.user.findFirst.mockResolvedValue(null);

      // Mock user update
      const updatedUser = {
        id: 'user-id-1',
        name: 'Updated Name',
        email: 'updated@example.com',
        password: 'hashed-password',
        role: 'ADMIN',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      // Act
      await adminController.updateUser(req, res);

      // Assert
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'updated@example.com',
          id: { not: 'user-id-1' },
        },
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: {
          name: 'Updated Name',
          email: 'updated@example.com',
          role: 'ADMIN',
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          companyId: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should update password if provided', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'user-id-1',
        },
        body: {
          password: 'new-password',
        },
      });

      const res = mockResponse();

      // Mock user update
      const updatedUser = {
        id: 'user-id-1',
        name: 'User 1',
        email: 'user1@example.com',
        password: 'hashed-password',
        role: 'EMPLOYEE',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      // Act
      await adminController.updateUser(req, res);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('new-password', 10);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: {
          password: 'hashed-password',
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if email already exists', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'user-id-1',
        },
        body: {
          email: 'existing@example.com',
        },
      });

      const res = mockResponse();

      // Mock existing user with same email
      const existingUser = {
        id: 'other-user-id',
        email: 'existing@example.com',
      };

      prismaMock.user.findFirst.mockResolvedValue(existingUser as any);

      // Act
      await adminController.updateUser(req, res);

      // Assert
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'このメールアドレスは既に使用されています',
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      prismaMock.user.delete.mockResolvedValue({} as any);

      // Act
      await adminController.deleteUser(req, res);

      // Assert
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'ユーザーを削除しました',
      });
    });

    it('should return 400 if trying to delete yourself', async () => {
      // Arrange
      const req = mockAdminRequest({
        user: {
          id: 'admin-user-id',
          role: 'ADMIN'
        },
        params: {
          id: 'admin-user-id', // 自分自身のID
        },
      });

      const res = mockResponse();

      // Act
      await adminController.deleteUser(req, res);

      // Assert
      expect(prismaMock.user.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '自分自身を削除することはできません',
      });
    });

    it('should handle server errors', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'user-id-1',
        },
      });

      const res = mockResponse();

      prismaMock.user.delete.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await adminController.deleteUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザー削除中にエラーが発生しました',
      });
    });
  });
});
