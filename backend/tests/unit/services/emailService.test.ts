import { emailService } from '../../../src/services/emailService';
import { v4 as uuidv4 } from 'uuid';
import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import dotenv from 'dotenv';

// Load environment variables
beforeAll(() => {
  dotenv.config();
});

describe('Email Service', () => {
  it('should send a verification email', async () => {
    // Mock console.log to prevent output during tests
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Generate a test verification token
    const verificationToken = uuidv4();
    const userId = uuidv4();
    
    // Send a test verification email
    const result = await emailService.sendVerificationEmail(
      'test@example.com',
      'テストユーザー',
      verificationToken,
      userId
    );
    
    // Restore console.log
    consoleSpy.mockRestore();
    
    // Verify the result
    expect(result).toBeDefined();
    // Add more specific assertions based on the expected return value
  });
});
