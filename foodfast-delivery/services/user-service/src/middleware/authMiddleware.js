const { verifyToken } = require('../utils/jwt');
// 1. Import UserRepository để kiểm tra CSDL
const UserRepository = require('../repositories/userRepository');

/**
 * Authenticate user via JWT token
 */
// 2. Thêm "async" vì chúng ta sẽ gọi CSDL
const authenticate = async (req, res, next) => {
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

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token); // Giải mã token
    
    // --- 3. PHẦN CODE MỚI ĐỂ KIỂM TRA BAN ---
    const userId = decoded.id; // Lấy ID từ token
    if (!userId) {
      console.log('🚫 Token does not contain user ID');
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Truy vấn CSDL để lấy trạng thái mới nhất của user
    // Chúng ta dùng file repository đã có sẵn
    const user = await UserRepository.findById(userId);

    // Kiểm tra xem user có tồn tại, có active, và KHÔNG bị ban không
    if (!user || !user.is_active || user.status === 'BANNED') {
      console.log(`🚫 Auth failed for user ${userId}. Status: ${user?.status}, Active: ${user?.is_active}`);
      
      // Trả về lỗi 401 (Unauthorized)
      // Frontend (api-client.ts) của bạn sẽ bắt lỗi này và tự động logout
      return res.status(401).json({ 
        success: false, 
        message: 'Your account has been suspended or deactivated.' 
      });
    }
    // --- KẾT THÚC PHẦN CODE MỚI ---

    console.log('✅ Token decoded and user validated:', user.email);

    // 4. Gắn toàn bộ object user (thay vì chỉ token) vào request
    // để các hàm controller/authorize phía sau có thông tin mới nhất
    req.user = user;
    next();

  } catch (error) {
    console.error('❌ JWT verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Authorize user based on roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // 5. Code này không cần sửa, vì nó đọc req.user.role
    // mà chúng ta đã gán ở trên
    if (!req.user || !roles.includes(req.user.role)) {
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