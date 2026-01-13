/**
 * Test Setup
 * Jest configuration and test utilities
 */

require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock MongoDB connection for tests
jest.mock('../server', () => {
  const express = require('express');
  return express();
});

// Global test utilities
global.testUtils = {
  // Create a test user object
  createTestUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'admin',
    ...overrides
  }),

  // Create a test session
  createTestSession: (user = null) => ({
    user: user || global.testUtils.createTestUser(),
    csrfToken: 'test-csrf-token'
  }),

  // Create a mock request
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    path: '/',
    body: {},
    query: {},
    params: {},
    session: global.testUtils.createTestSession(),
    ip: '127.0.0.1',
    ...overrides
  }),

  // Create a mock response
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      render: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      locals: {}
    };
    return res;
  }
};

// Setup and teardown
beforeAll(async () => {
  // Setup test database connection if needed
});

afterAll(async () => {
  // Cleanup test database if needed
});
