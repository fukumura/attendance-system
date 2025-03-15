import { Request, Response } from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Extend Express Request type for testing
type MockRequest = DeepMockProxy<Request> & {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

// Extend Express Response type for testing
type MockResponse = DeepMockProxy<Response> & {
  statusCode?: number;
  body?: any;
};

// Mock request factory
export const mockRequest = (options: Partial<Request & { user?: any }> = {}): MockRequest => {
  const req = mockDeep<Request>() as MockRequest;
  
  // Default values
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'EMPLOYEE'
  };
  
  // Override with provided options
  Object.assign(req, options);
  
  return req;
};

// Mock admin request factory
export const mockAdminRequest = (options: Partial<Request & { user?: any }> = {}): MockRequest => {
  const req = mockRequest(options);
  req.user = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN'
  };
  
  // Override with provided options
  if (options.user) {
    req.user = { ...req.user, ...options.user };
  }
  
  return req;
};

// Mock response factory
export const mockResponse = (): MockResponse => {
  const res = mockDeep<Response>() as MockResponse;
  
  // Mock chaining methods
  res.status.mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  
  res.json.mockImplementation((data) => {
    res.body = data;
    return res;
  });
  
  return res;
};

// Export the prisma mock from setup
export { prismaMock } from '../setup';
