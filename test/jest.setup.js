// Set NODE_ENV to test for Jest environment
process.env.NODE_ENV = 'test';

// Load .env file for tests
require('dotenv').config();

console.log('🧪 Jest setup: NODE_ENV set to test');
