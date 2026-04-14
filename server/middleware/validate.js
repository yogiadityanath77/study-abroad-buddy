// server/middleware/validate.js
// Pure validation helpers — each returns an error message string or null.
// Used by controllers to validate request bodies before touching the DB.

// Checks that a string is a plausible email address.
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
};

// Checks that a value is a non-empty string after trimming.
const isNonEmpty = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

// Checks that end date is strictly after start date.
// Accepts ISO strings or Date objects. Returns true if either is missing (optional fields).
const isEndAfterStart = (start, end) => {
  if (!start || !end) return true;
  return new Date(end) > new Date(start);
};

module.exports = { isValidEmail, isNonEmpty, isEndAfterStart };