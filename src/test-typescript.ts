// Test TypeScript compilation
import { ApiResponse, User } from './types/index';

const testUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
};

const testResponse: ApiResponse<User> = {
  success: true,
  data: testUser,
  message: 'User retrieved successfully',
  timestamp: new Date().toISOString()
};

console.log('TypeScript is working!', testResponse);

export default testResponse;
