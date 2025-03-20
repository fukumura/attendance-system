import { companyController } from '../../../src/controllers/companyController';
import { mockRequest, mockResponse, mockSuperAdminRequest, mockAdminRequest, prismaMock } from '../../utils/testUtils';
import * as companyUtils from '../../../src/utils/companyUtils';
import { jest } from '@jest/globals';

// Mock companyUtils
jest.mock('../../../src/utils/companyUtils', () => ({
  generatePublicCompanyId: jest.fn().mockReturnValue('TEST1234'),
  findCompanyIdByPublicId: jest.fn(),
}));

// Type assertion for Prisma mock to avoid TypeScript errors
const typedPrismaMock = prismaMock as {
  company: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  user: {
    count: jest.Mock;
  };
};

describe('Company Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompanies', () => {
    it('should get companies list successfully', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        query: {
          page: '1',
          limit: '10'
        }
      });
      
      const res = mockResponse();
      
      const mockCompanies = [
        {
          id: 'company-id-1',
          publicId: 'ABC12345',
          name: 'Test Company 1',
          logoUrl: 'https://example.com/logo1.png',
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'company-id-2',
          publicId: 'DEF67890',
          name: 'Test Company 2',
          logoUrl: 'https://example.com/logo2.png',
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Prisma mock setup
      typedPrismaMock.company.findMany.mockResolvedValue(mockCompanies);
      typedPrismaMock.company.count.mockResolvedValue(2);
      
      // Act
      await companyController.getCompanies(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: {
          name: 'asc',
        },
      });
      
      expect(typedPrismaMock.company.count).toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCompanies,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should use default pagination values when not provided', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        query: {} // No pagination params
      });
      
      const res = mockResponse();
      
      const mockCompanies = [
        {
          id: 'company-id-1',
          publicId: 'ABC12345',
          name: 'Test Company 1',
          logoUrl: 'https://example.com/logo1.png',
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      typedPrismaMock.company.findMany.mockResolvedValue(mockCompanies);
      typedPrismaMock.company.count.mockResolvedValue(1);
      
      // Act
      await companyController.getCompanies(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findMany).toHaveBeenCalledWith({
        skip: 0, // Default page 1
        take: 10, // Default limit 10
        orderBy: {
          name: 'asc',
        },
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = mockSuperAdminRequest();
      const res = mockResponse();
      
      // Mock database error
      typedPrismaMock.company.findMany.mockRejectedValue(new Error('Database error'));
      
      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await companyController.getCompanies(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業一覧の取得中にエラーが発生しました',
      });
    });
  });

  describe('getCompany', () => {
    it('should get company by ID successfully', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'company-id-1'
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        name: 'Test Company',
        logoUrl: 'https://example.com/logo.png',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      
      // Act
      await companyController.getCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'company-id-1' }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCompany,
      });
    });

    it('should get company by publicId successfully', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'ABC12345' // publicId (not a UUID)
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        name: 'Test Company',
        logoUrl: 'https://example.com/logo.png',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      
      // Act
      await companyController.getCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'ABC12345' }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCompany,
      });
    });

    it('should return 404 if company not found', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'nonexistent-id'
        }
      });
      
      const res = mockResponse();
      
      typedPrismaMock.company.findUnique.mockResolvedValue(null);
      
      // Act
      await companyController.getCompany(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業が見つかりません',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'company-id-1'
        }
      });
      
      const res = mockResponse();
      
      typedPrismaMock.company.findUnique.mockRejectedValue(new Error('Database error'));
      
      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await companyController.getCompany(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業情報の取得中にエラーが発生しました',
      });
    });
  });

  describe('createCompany', () => {
    it('should create company successfully', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        body: {
          name: 'New Company',
          logoUrl: 'https://example.com/logo.png',
          settings: { theme: 'light' }
        }
      });
      
      const res = mockResponse();
      
      const mockNewCompany = {
        id: 'new-company-id',
        publicId: 'TEMP',
        name: 'New Company',
        logoUrl: 'https://example.com/logo.png',
        settings: { theme: 'light' },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockUpdatedCompany = {
        ...mockNewCompany,
        publicId: 'TEST1234'
      };
      
      typedPrismaMock.company.create.mockResolvedValue(mockNewCompany);
      typedPrismaMock.company.update.mockResolvedValue(mockUpdatedCompany);
      
      // Act
      await companyController.createCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.create).toHaveBeenCalledWith({
        data: {
          name: 'New Company',
          logoUrl: 'https://example.com/logo.png',
          settings: { theme: 'light' },
          publicId: 'TEMP',
        },
      });
      
      expect(companyUtils.generatePublicCompanyId).toHaveBeenCalledWith('new-company-id');
      
      expect(typedPrismaMock.company.update).toHaveBeenCalledWith({
        where: { id: 'new-company-id' },
        data: { publicId: 'TEST1234' },
      });
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockUpdatedCompany,
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        body: {
          // Missing required name
          logoUrl: 'https://example.com/logo.png'
        }
      });
      
      const res = mockResponse();
      
      // Act
      await companyController.createCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String), // Validation error message
      });
    });

    it('should handle invalid URL in logoUrl', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        body: {
          name: 'New Company',
          logoUrl: 'invalid-url' // Invalid URL
        }
      });
      
      const res = mockResponse();
      
      // Act
      await companyController.createCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String), // Validation error message
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        body: {
          name: 'New Company',
          logoUrl: 'https://example.com/logo.png',
          settings: {}
        }
      });
      
      const res = mockResponse();
      
      typedPrismaMock.company.create.mockRejectedValue(new Error('Database error'));
      
      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await companyController.createCompany(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業作成中にエラーが発生しました',
      });
    });
  });

  describe('updateCompany', () => {
    it('should update company by ID successfully', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'company-id-1'
        },
        body: {
          name: 'Updated Company',
          logoUrl: 'https://example.com/updated-logo.png'
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        name: 'Test Company',
        logoUrl: 'https://example.com/logo.png',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockUpdatedCompany = {
        ...mockCompany,
        name: 'Updated Company',
        logoUrl: 'https://example.com/updated-logo.png'
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      typedPrismaMock.company.update.mockResolvedValue(mockUpdatedCompany);
      
      // Act
      await companyController.updateCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'company-id-1' }
      });
      
      expect(typedPrismaMock.company.update).toHaveBeenCalledWith({
        where: { id: 'company-id-1' },
        data: {
          name: 'Updated Company',
          logoUrl: 'https://example.com/updated-logo.png'
        },
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockUpdatedCompany,
      });
    });

    it('should update company by publicId successfully', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'ABC12345' // publicId (not a UUID)
        },
        body: {
          name: 'Updated Company'
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        name: 'Test Company',
        logoUrl: 'https://example.com/logo.png',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockUpdatedCompany = {
        ...mockCompany,
        name: 'Updated Company'
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      typedPrismaMock.company.update.mockResolvedValue(mockUpdatedCompany);
      
      // Act
      await companyController.updateCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'ABC12345' }
      });
      
      expect(typedPrismaMock.company.update).toHaveBeenCalledWith({
        where: { id: 'company-id-1' },
        data: {
          name: 'Updated Company'
        },
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockUpdatedCompany,
      });
    });

    it('should return 404 if company not found', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'nonexistent-id'
        },
        body: {
          name: 'Updated Company'
        }
      });
      
      const res = mockResponse();
      
      typedPrismaMock.company.findUnique.mockResolvedValue(null);
      
      // Act
      await companyController.updateCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業が見つかりません',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'company-id-1'
        },
        body: {
          logoUrl: 'invalid-url' // Invalid URL
        }
      });
      
      const res = mockResponse();
      
      // Act
      await companyController.updateCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.any(String), // Validation error message
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'company-id-1'
        },
        body: {
          name: 'Updated Company'
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        name: 'Test Company',
        logoUrl: 'https://example.com/logo.png',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      typedPrismaMock.company.update.mockRejectedValue(new Error('Database error'));
      
      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await companyController.updateCompany(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業更新中にエラーが発生しました',
      });
    });
  });

  describe('deleteCompany', () => {
    it('should delete company by ID successfully', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'company-id-1'
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        name: 'Test Company',
        logoUrl: 'https://example.com/logo.png',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      typedPrismaMock.user.count.mockResolvedValue(0); // No users associated
      typedPrismaMock.company.delete.mockResolvedValue(mockCompany);
      
      // Act
      await companyController.deleteCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'company-id-1' }
      });
      
      expect(typedPrismaMock.user.count).toHaveBeenCalledWith({
        where: { companyId: 'company-id-1' }
      });
      
      expect(typedPrismaMock.company.delete).toHaveBeenCalledWith({
        where: { id: 'company-id-1' }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: '企業を削除しました',
      });
    });

    it('should delete company by publicId successfully', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'ABC12345' // publicId (not a UUID)
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        name: 'Test Company',
        logoUrl: 'https://example.com/logo.png',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      typedPrismaMock.user.count.mockResolvedValue(0); // No users associated
      typedPrismaMock.company.delete.mockResolvedValue(mockCompany);
      
      // Act
      await companyController.deleteCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'ABC12345' }
      });
      
      expect(typedPrismaMock.company.delete).toHaveBeenCalledWith({
        where: { id: 'company-id-1' }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if company not found', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'nonexistent-id'
        }
      });
      
      const res = mockResponse();
      
      typedPrismaMock.company.findUnique.mockResolvedValue(null);
      
      // Act
      await companyController.deleteCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.user.count).not.toHaveBeenCalled();
      expect(typedPrismaMock.company.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業が見つかりません',
      });
    });

    it('should return 400 if company has associated users', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'company-id-1'
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        name: 'Test Company',
        logoUrl: 'https://example.com/logo.png',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      typedPrismaMock.user.count.mockResolvedValue(5); // 5 users associated
      
      // Act
      await companyController.deleteCompany(req, res);
      
      // Assert
      expect(typedPrismaMock.company.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'この企業にはユーザーが存在するため削除できません。先にユーザーを削除または移動してください。',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = mockSuperAdminRequest({
        params: {
          id: 'company-id-1'
        }
      });
      
      const res = mockResponse();
      
      typedPrismaMock.company.findUnique.mockRejectedValue(new Error('Database error'));
      
      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await companyController.deleteCompany(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業削除中にエラーが発生しました',
      });
    });
  });

  describe('getCompanySettings', () => {
    it('should get company settings by ID successfully', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'company-id-1'
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        settings: {
          theme: 'dark',
          workHours: { start: '9:00', end: '18:00' }
        }
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      
      // Act
      await companyController.getCompanySettings(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'company-id-1' },
        select: { settings: true }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCompany.settings,
      });
    });

    it('should get company settings by publicId successfully', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'ABC12345' // publicId (not a UUID)
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        settings: {
          theme: 'light',
          workHours: { start: '9:00', end: '17:00' }
        }
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      
      // Act
      await companyController.getCompanySettings(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'ABC12345' },
        select: { settings: true }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCompany.settings,
      });
    });

    it('should return empty object if settings is null', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'company-id-1'
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        settings: null
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      
      // Act
      await companyController.getCompanySettings(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {},
      });
    });

    it('should return 404 if company not found', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'nonexistent-id'
        }
      });
      
      const res = mockResponse();
      
      typedPrismaMock.company.findUnique.mockResolvedValue(null);
      
      // Act
      await companyController.getCompanySettings(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業が見つかりません',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = mockRequest({
        params: {
          id: 'company-id-1'
        }
      });
      
      const res = mockResponse();
      
      typedPrismaMock.company.findUnique.mockRejectedValue(new Error('Database error'));
      
      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await companyController.getCompanySettings(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業設定の取得中にエラーが発生しました',
      });
    });
  });

  describe('updateCompanySettings', () => {
    it('should update company settings by ID successfully', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'company-id-1'
        },
        body: {
          theme: 'dark',
          workHours: { start: '9:00', end: '18:00' }
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        settings: {
          theme: 'light',
          workHours: { start: '9:00', end: '17:00' }
        }
      };
      
      const mockUpdatedCompany = {
        ...mockCompany,
        settings: {
          theme: 'dark',
          workHours: { start: '9:00', end: '18:00' }
        }
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      typedPrismaMock.company.update.mockResolvedValue(mockUpdatedCompany);
      
      // Act
      await companyController.updateCompanySettings(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'company-id-1' }
      });
      
      expect(typedPrismaMock.company.update).toHaveBeenCalledWith({
        where: { id: 'company-id-1' },
        data: { settings: req.body }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockUpdatedCompany.settings,
      });
    });

    it('should update company settings by publicId successfully', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'ABC12345' // publicId (not a UUID)
        },
        body: {
          theme: 'dark',
          notifications: { enabled: true }
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        settings: {
          theme: 'light'
        }
      };
      
      const mockUpdatedCompany = {
        ...mockCompany,
        settings: {
          theme: 'dark',
          notifications: { enabled: true }
        }
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      typedPrismaMock.company.update.mockResolvedValue(mockUpdatedCompany);
      
      // Act
      await companyController.updateCompanySettings(req, res);
      
      // Assert
      expect(typedPrismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'ABC12345' }
      });
      
      expect(typedPrismaMock.company.update).toHaveBeenCalledWith({
        where: { id: 'company-id-1' },
        data: { settings: req.body }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockUpdatedCompany.settings,
      });
    });

    it('should return 404 if company not found', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'nonexistent-id'
        },
        body: {
          theme: 'dark'
        }
      });
      
      const res = mockResponse();
      
      typedPrismaMock.company.findUnique.mockResolvedValue(null);
      
      // Act
      await companyController.updateCompanySettings(req, res);
      
      // Assert
      expect(typedPrismaMock.company.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業が見つかりません',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'company-id-1'
        },
        body: 'invalid-settings' // Not an object
      });
      
      const res = mockResponse();
      
      // Act
      await companyController.updateCompanySettings(req, res);
      
      // Assert
      expect(typedPrismaMock.company.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '無効な設定データです',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const req = mockAdminRequest({
        params: {
          id: 'company-id-1'
        },
        body: {
          theme: 'dark'
        }
      });
      
      const res = mockResponse();
      
      const mockCompany = {
        id: 'company-id-1',
        publicId: 'ABC12345',
        settings: {
          theme: 'light'
        }
      };
      
      typedPrismaMock.company.findUnique.mockResolvedValue(mockCompany);
      typedPrismaMock.company.update.mockRejectedValue(new Error('Database error'));
      
      // Suppress console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await companyController.updateCompanySettings(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '企業設定の更新中にエラーが発生しました',
      });
    });
  });
});
