// tests/authMiddleware.test.js
// Unit tests for the JWT auth middleware.
// Mocks jsonwebtoken so no real secret or token is needed.

const jwt = require('jsonwebtoken');
const protect = require('../middleware/authMiddleware');

jest.mock('jsonwebtoken');

// Helper — builds a minimal mock res object with chainable status/json
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware — protect', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  test('calls next() and attaches decoded user when token is valid', () => {
    const decoded = { id: 'user123', name: 'Test User', email: 'test@example.com' };
    jwt.verify.mockReturnValue(decoded);

    const req = { headers: { authorization: 'Bearer validtoken' } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test_secret');
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header is missing', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token, access denied' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Token sometoken' } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token, access denied' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is expired or invalid', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const req = { headers: { authorization: 'Bearer expiredtoken' } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is invalid or expired' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header is an empty string', () => {
    const req = { headers: { authorization: '' } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

});
