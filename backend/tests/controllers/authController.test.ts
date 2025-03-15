import { authController } from '../../src/controllers/authController';
import { mockRequest, mockResponse, prismaMock } from '../utils/testUtils';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock bcrypt and jwt
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

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
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      
      // Mock JWT token generation
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      // Mock user creation
      const mockUser = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'EMPLOYEE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(null); // No existing user
      prismaMock.user.create.mockResolvedValue(mockUser as any);

      // Act
      await authController.register(req, res);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed_password',
          role: 'EMPLOYEE',
        },
      });
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        'test-secret',
        { expiresIn: '24h' }
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          token: 'mock_token',
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        },
      });
    });

    it('should return 400 if email already exists', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(existingUser as any);

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
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Act
      await authController.register(req, res);

      // Assert
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
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
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      
      // Mock database error
      prismaMock.user.findUnique.mockResolvedValue(null);
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
          password: 'password123',
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      // Mock password comparison
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock JWT token generation
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      // Act
      await authController.login(req, res);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        'test-secret',
        { expiresIn: '24h' }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          token: 'mock_token',
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        },
      });
    });

    it('should return 401 with invalid credentials', async () => {
      // Arrange
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'wrong_password',
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      // Mock password comparison (fails)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      await authController.login(req, res);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
      expect(jwt.sign).not.toHaveBeenCalled();
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
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Mock user retrieval (not found)
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act
      await authController.login(req, res);

      // Assert
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
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
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Act
      await authController.login(req, res);

      // Assert
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
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
          password: 'password123',
        },
      });

      const res = mockResponse();

      // Mock database error
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      await authController.getCurrentUser(req, res);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: req.user?.id },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
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
});