import { authController } from '../../../src/controllers/authController';
import { mockRequest, mockResponse, prismaMock } from '../../utils/testUtils';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals';

// Mock bcrypt and jwt
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Type the mocked functions
const mockedBcrypt = bcrypt as jest.Mocked<any>;
const mockedJwt = jwt as jest.Mocked<any>;

// Mock process.env
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        },
      });

      const res = mockResponse();

      // Mock bcrypt hash
      mockedBcrypt.hash.mockResolvedValue('hashed_password');
      
      // Mock JWT token generation
      mockedJwt.sign.mockImplementation((payload, secret, options) => {
        return 'mock_token';
      });

      // Mock user creation
      const mockUser = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'EMPLOYEE',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      };

      prismaMock.user.findFirst.mockResolvedValue(null); // No existing user
      prismaMock.user.create.mockResolvedValue(mockUser as any);

      // Act
      await authController.register(req, res);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed_password',
          role: 'EMPLOYEE',
          isEmailVerified: false,
          verificationToken: expect.any(String),
          verificationTokenExpiry: expect.any(Date),
        },
      });
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'ユーザーが作成され、認証メールが送信されました',
        data: {
          user: expect.objectContaining({
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
          }),
        },
      });
    });

    it('should return 400 if email already exists', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          name: 'Test User',
          email: 'existing@example.com',
          password: 'Password123!',
        },
      });

      const res = mockResponse();

      // Mock existing user
      const existingUser = {
        id: 'existing-user-id',
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'hashed_password',
        role: 'EMPLOYEE',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findFirst.mockResolvedValue(existingUser as any);

      // Act
      await authController.register(req, res);

      // Assert
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'このメールアドレスは既に登録されています',
      });
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          name: 'Test User',
          // Missing email
          password: 'Password123!',
        },
      });

      const res = mockResponse();

      // Act
      await authController.register(req, res);

      // Assert
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String), // Validation error message
      });
    });

    it('should handle server errors during registration', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        },
      });

      const res = mockResponse();

      // Mock bcrypt hash
      mockedBcrypt.hash.mockResolvedValue('hashed_password');
      
      // Mock database error
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await authController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザー登録中にエラーが発生しました',
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      });

      const res = mockResponse();

      // Mock user retrieval
      const mockUser = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'EMPLOYEE',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEmailVerified: true,
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);

      // Mock password comparison
      mockedBcrypt.compare.mockResolvedValue(true);

      // Mock JWT token generation
      mockedJwt.sign.mockImplementation((payload, secret, options) => {
        return 'mock_token';
      });

      // Act
      await authController.login(req, res);

      // Assert
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashed_password');
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, companyId: null, role: mockUser.role },
        'test-secret',
        { expiresIn: '24h' }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            companyId: null,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
          token: 'mock_token',
        },
      });
    });

    it('should return 403 if email is not verified', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      });

      const res = mockResponse();

      // Mock user retrieval
      const mockUser = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'EMPLOYEE',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEmailVerified: false,
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);

      // Mock password comparison
      mockedBcrypt.compare.mockResolvedValue(true);

      // Act
      await authController.login(req, res);

      // Assert
      expect(mockedJwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'メールアドレスが認証されていません。認証メールを確認してください。',
        needsVerification: true,
        email: mockUser.email,
      });
    });

    it('should return 401 with invalid credentials', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'WrongPassword123!',
        },
      });

      const res = mockResponse();

      // Mock user retrieval
      const mockUser = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'EMPLOYEE',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEmailVerified: true,
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);

      // Mock password comparison (fails)
      mockedBcrypt.compare.mockResolvedValue(false);

      // Act
      await authController.login(req, res);

      // Assert
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('WrongPassword123!', 'hashed_password');
      expect(mockedJwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'メールアドレスまたはパスワードが正しくありません',
      });
    });

    it('should return 401 if user not found', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'Password123!',
        },
      });

      const res = mockResponse();

      // Mock user retrieval (not found)
      prismaMock.user.findFirst.mockResolvedValue(null);

      // Act
      await authController.login(req, res);

      // Assert
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(mockedJwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'メールアドレスまたはパスワードが正しくありません',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          // Missing email
          password: 'Password123!',
        },
      });

      const res = mockResponse();

      // Act
      await authController.login(req, res);

      // Assert
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String),
      });
    });

    it('should handle server errors during login', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      });

      const res = mockResponse();

      // Mock database error
      prismaMock.user.findFirst.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await authController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ログイン中にエラーが発生しました',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return user profile for authenticated user', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();

      // Mock user retrieval
      const mockUser = {
        id: req.user?.id,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'EMPLOYEE',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      await authController.getCurrentUser(req, res);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: req.user?.id }
      });

      expect(res.status).toHaveBeenCalledWith(200);
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

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req = mockRequest({ user: undefined });
      const res = mockResponse();

      // Act
      await authController.getCurrentUser(req, res);

      // Assert
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です',
      });
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();

      // Mock user retrieval (not found)
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act
      await authController.getCurrentUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザーが見つかりません',
      });
    });

    it('should handle server errors when getting current user', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();

      // Mock database error
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await authController.getCurrentUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザー情報の取得中にエラーが発生しました',
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          name: 'Updated Name',
          email: 'updated@example.com',
        },
      });

      const res = mockResponse();

      // Mock user update
      const updatedUser = {
        id: req.user?.id,
        name: 'Updated Name',
        email: 'updated@example.com',
        password: 'hashed_password',
        role: 'EMPLOYEE',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findFirst.mockResolvedValue(null); // No duplicate email
      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      // Act
      await authController.updateProfile(req, res);

      // Assert
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'updated@example.com',
          id: { not: req.user?.id },
        },
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: req.user?.id },
        data: {
          name: 'Updated Name',
          email: 'updated@example.com',
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

    it('should return 400 if email already exists', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          name: 'Updated Name',
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
      await authController.updateProfile(req, res);

      // Assert
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'このメールアドレスは既に使用されています',
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req = mockRequest({
        user: undefined,
        body: {
          name: 'Updated Name',
          email: 'updated@example.com',
        },
      });

      const res = mockResponse();

      // Act
      await authController.updateProfile(req, res);

      // Assert
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です',
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!',
        },
      });

      const res = mockResponse();

      // Mock user retrieval
      const mockUser = {
        id: req.user?.id,
        password: 'hashed_current_password',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      // Mock password comparison
      mockedBcrypt.compare.mockResolvedValue(true);

      // Mock password hashing
      mockedBcrypt.hash.mockResolvedValue('hashed_new_password');

      // Act
      await authController.changePassword(req, res);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: req.user?.id }
      });

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'CurrentPassword123!',
        'hashed_current_password'
      );

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: req.user?.id },
        data: {
          password: 'hashed_new_password',
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'パスワードが正常に変更されました',
      });
    });

    it('should return 400 if current password is incorrect', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        },
      });

      const res = mockResponse();

      // Mock user retrieval
      const mockUser = {
        id: req.user?.id,
        password: 'hashed_current_password',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      // Mock password comparison (fails)
      mockedBcrypt.compare.mockResolvedValue(false);

      // Act
      await authController.changePassword(req, res);

      // Assert
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '現在のパスワードが正しくありません',
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const req = mockRequest({
        user: undefined,
        body: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!',
        },
      });

      const res = mockResponse();

      // Act
      await authController.changePassword(req, res);

      // Assert
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '認証が必要です',
      });
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!',
        },
      });

      const res = mockResponse();

      // Mock user retrieval (not found)
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act
      await authController.changePassword(req, res);

      // Assert
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ユーザーが見つかりません',
      });
    });
  });

  describe('setupAdmin', () => {
    it('should create initial admin user successfully', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'AdminPassword123!',
        },
      });

      const res = mockResponse();

      // Mock admin check
      prismaMock.user.findFirst.mockResolvedValueOnce(null); // No admin exists
      prismaMock.user.findFirst.mockResolvedValueOnce(null); // No duplicate email

      // Mock password hashing
      mockedBcrypt.hash.mockResolvedValue('hashed_admin_password');

      // Mock admin creation
      const newAdmin = {
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashed_admin_password',
        role: 'ADMIN',
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.create.mockResolvedValue(newAdmin as any);

      // Mock JWT token generation
      mockedJwt.sign.mockImplementation((payload, secret, options) => {
        return 'admin_token';
      });

      // Act
      await authController.setupAdmin(req, res);

      // Assert
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { role: 'ADMIN' }
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'hashed_admin_password',
          role: 'ADMIN',
        },
      });

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: newAdmin.id, companyId: null, role: newAdmin.role },
        'test-secret',
        { expiresIn: '24h' }
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          user: {
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role,
            companyId: null,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
          token: 'admin_token',
        },
      });
    });

    it('should return 403 if admin already exists', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'AdminPassword123!',
        },
      });

      const res = mockResponse();

      // Mock existing admin
      const existingAdmin = {
        id: 'existing-admin-id',
        role: 'ADMIN',
      };

      prismaMock.user.findFirst.mockResolvedValue(existingAdmin as any);

      // Act
      await authController.setupAdmin(req, res);

      // Assert
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '管理者ユーザーは既に存在します。このエンドポイントは使用できません。',
      });
    });
  });
});
