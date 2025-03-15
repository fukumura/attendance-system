import { prismaMock } from '../utils/testUtils';
import { mockRequest, mockAdminRequest, mockResponse } from '../utils/testUtils';
import { adminController } from '../../src/controllers/adminController';

// モジュールのモック化
jest.mock('../../src/app', () => ({
  prisma: prismaMock,
}));

// bcryptのモック化
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('Admin Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });
});