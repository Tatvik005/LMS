const prisma = require('../config/db');

// Mock Auth Middleware for testing Person 2's components
// In a real app, this would verify a JWT
const mockAuth = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId || !userRole) {
    return res.status(401).json({ error: 'Unauthorized. Missing x-user-id or x-user-role headers.' });
  }

  try {
    // Check if mock user exists, if not, create it for testing
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: `Test ${userRole}`,
          email: `test${userId}@example.com`,
          role: userRole,
        }
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error during auth.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { mockAuth, requireRole };
