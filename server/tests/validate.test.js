// tests/validate.test.js
// Unit tests for the pure validation helpers in middleware/validate.js.
// No mocks needed — these functions have no dependencies.

const { isValidEmail, isNonEmpty, isEndAfterStart } = require('../middleware/validate');

// ── isValidEmail ─────────────────────────────────────────────

describe('isValidEmail', () => {
  test('accepts a standard email address', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  test('accepts email with subdomain', () => {
    expect(isValidEmail('user@mail.example.co.uk')).toBe(true);
  });

  test('accepts email with plus sign', () => {
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  test('rejects email with no @ symbol', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  test('rejects email with no domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  test('rejects email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  test('rejects plain text with no structure', () => {
    expect(isValidEmail('notanemail')).toBe(false);
  });

  test('is case insensitive — uppercased email still passes', () => {
    expect(isValidEmail('USER@EXAMPLE.COM')).toBe(true);
  });
});

// ── isNonEmpty ───────────────────────────────────────────────

describe('isNonEmpty', () => {
  test('returns true for a normal string', () => {
    expect(isNonEmpty('hello')).toBe(true);
  });

  test('returns true for a string with internal spaces', () => {
    expect(isNonEmpty('University College London')).toBe(true);
  });

  test('returns false for an empty string', () => {
    expect(isNonEmpty('')).toBe(false);
  });

  test('returns false for a string of only spaces', () => {
    expect(isNonEmpty('   ')).toBe(false);
  });

  test('returns false for a number', () => {
    expect(isNonEmpty(42)).toBe(false);
  });

  test('returns false for null', () => {
    expect(isNonEmpty(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isNonEmpty(undefined)).toBe(false);
  });
});

// ── isEndAfterStart ──────────────────────────────────────────

describe('isEndAfterStart', () => {
  test('returns true when end is after start', () => {
    expect(isEndAfterStart('2025-09-01', '2026-06-30')).toBe(true);
  });

  test('returns false when end is before start', () => {
    expect(isEndAfterStart('2026-06-30', '2025-09-01')).toBe(false);
  });

  test('returns false when start and end are the same date', () => {
    expect(isEndAfterStart('2025-09-01', '2025-09-01')).toBe(false);
  });

  test('returns true when start is missing — dates are optional', () => {
    expect(isEndAfterStart(null, '2026-06-30')).toBe(true);
  });

  test('returns true when end is missing — dates are optional', () => {
    expect(isEndAfterStart('2025-09-01', null)).toBe(true);
  });

  test('returns true when both dates are missing', () => {
    expect(isEndAfterStart(null, null)).toBe(true);
  });

  test('works with Date objects as well as ISO strings', () => {
    const start = new Date('2025-09-01');
    const end = new Date('2026-06-30');
    expect(isEndAfterStart(start, end)).toBe(true);
  });
});
