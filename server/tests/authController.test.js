// tests/authController.test.js
// Unit tests for register and login in authController.
// Mocks: User model (mongoose), bcryptjs, jsonwebtoken.
// No DB connection or real API calls needed.

const { register, login } = require('../controllers/authController');

jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper — builds a minimal mock res with chainable status/json
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test_secret';
  jwt.sign.mockReturnValue('mocked_jwt_token');
});

// ── register ────────────────────────────────────────────────

describe('authController — register', () => {

  test('returns 400 when name is missing', async () => {
    const req = { body: { email: 'test@example.com', password: 'password123' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
  });

  test('returns 400 when email is missing', async () => {
    const req = { body: { name: 'Test User', password: 'password123' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
  });

  test('returns 400 when password is missing', async () => {
    const req = { body: { name: 'Test User', email: 'test@example.com' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
  });

  test('returns 400 for invalid email format', async () => {
    const req = { body: { name: 'Test User', email: 'notanemail', password: 'password123' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Please enter a valid email address' });
  });

  test('returns 400 when name is too short (less than 2 chars)', async () => {
    const req = { body: { name: 'A', email: 'test@example.com', password: 'password123' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Name must be at least 2 characters' });
  });

  test('returns 400 when password is less than 6 characters', async () => {
    const req = { body: { name: 'Test User', email: 'test@example.com', password: '123' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 6 characters' });
  });

  test('returns 400 when email is already registered', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com' });
    const req = { body: { name: 'Test User', email: 'test@example.com', password: 'password123' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
  });

  test('returns 201 with token and user on successful registration', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashedpassword');
    User.create.mockResolvedValue({
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      onboardingComplete: false,
    });

    const req = { body: { name: 'Test User', email: 'test@example.com', password: 'password123' } };
    const res = mockRes();
    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'mocked_jwt_token',
        user: expect.objectContaining({ email: 'test@example.com' }),
      })
    );
  });

  test('returns 500 on unexpected DB error', async () => {
    User.findOne.mockRejectedValue(new Error('DB connection failed'));
    const req = { body: { name: 'Test User', email: 'test@example.com', password: 'password123' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server error. Please try again.' });
  });

});

// ── login ───────────────────────────────────────────────────

describe('authController — login', () => {

  test('returns 400 when email is missing', async () => {
    const req = { body: { password: 'password123' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
  });

  test('returns 400 when password is missing', async () => {
    const req = { body: { email: 'test@example.com' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
  });

  test('returns 400 for invalid email format', async () => {
    const req = { body: { email: 'bademail', password: 'password123' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Please enter a valid email address' });
  });

  test('returns 400 when email is not found in DB', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: 'nobody@example.com', password: 'password123' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    // Same message for wrong email and wrong password — prevents enumeration
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
  });

  test('returns 400 when password does not match', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com', password: 'hashedpw' });
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: 'test@example.com', password: 'wrongpassword' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
  });

  test('returns 200 with token and user on successful login', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpw',
      onboardingComplete: true,
    });
    bcrypt.compare.mockResolvedValue(true);

    const req = { body: { email: 'test@example.com', password: 'password123' } };
    const res = mockRes();
    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'mocked_jwt_token',
        user: expect.objectContaining({ email: 'test@example.com' }),
      })
    );
  });

  test('returns 500 on unexpected DB error', async () => {
    User.findOne.mockRejectedValue(new Error('DB timeout'));
    const req = { body: { email: 'test@example.com', password: 'password123' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server error. Please try again.' });
  });

});
