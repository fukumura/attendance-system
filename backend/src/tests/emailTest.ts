import { emailService } from '../services/emailService';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test function to send a verification email
async function testVerificationEmail() {
  try {
    console.log('Starting email verification test...');
    
    // Generate a test verification token
    const verificationToken = uuidv4();
    const userId = uuidv4();
    
    // Send a test verification email
    const result = await emailService.sendVerificationEmail(
      'test@example.com', // Replace with your test email
      'テストユーザー',
      verificationToken,
      userId
    );
    
    console.log('Email sent successfully!');
    console.log('Result:', result);
    
    // If using Ethereal Email, the preview URL will be logged
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Run the test
testVerificationEmail();
