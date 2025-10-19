const { verifyToken } = require('../utils/jwt');

/**
 * Authenticate user via JWT token
 */
const authenticate = (req, res, next) => {
  try {
    console.log('🔍 Incoming headers:', req.headers);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🚫 No valid Authorization header');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // ✅ Khai báo token TRƯỚC khi gọi verifyToken
    const token = authHeader.split(' ')[1];
    console.log('🔑 Token received (first 30 chars):', token.slice(0, 30));

    // ✅ Gọi verifyToken và gán decoded
    const decoded = verifyToken(token);
    console.log('✅ Token decoded successfully:', decoded);

    // ✅ Gắn decoded info vào req.user để các route khác dùng
    req.user = decoded;
    next();

  } catch (error) {
    console.error('❌ JWT verification error:', error.message);
    console.log('🧩 process.env.JWT_SECRET inside container =', process.env.JWT_SECRET);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Authorize user based on roles
 * Usage: authorize('ADMIN', 'RESTAURANT')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
