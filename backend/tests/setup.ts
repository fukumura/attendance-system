// Jest setup file
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaMockReturnTypes } from './types';

// Create a mock instance of PrismaClient with proper return types
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient> & PrismaMockReturnTypes;

// Mock the PrismaClient
jest.mock('../src/app', () => ({
  prisma: prismaMock,
  __esModule: true,
  default: jest.fn(),
}));

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});
