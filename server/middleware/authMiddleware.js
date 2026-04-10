// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Protects routes — checks for a valid JWT in the Authorization header
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Header must look like: "Bearer eyJhbGci..."
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attaches { id, name, email } to every protected request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = protect;