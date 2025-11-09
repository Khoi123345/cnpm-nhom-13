const authService = require('../services/authService');
const userService = require('../services/userService');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, full_name, phone } = req.body;
      // Kiểm tra đầu vào
      if (!email || !password || !full_name || !phone) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký' });
      }
      const { user, token } = await authService.registerUser({ email, password, full_name, phone });
      return res.status(201).json({ success: true, message: 'Đăng ký thành công', user, token });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      // Kiểm tra đầu vào
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Thiếu email hoặc mật khẩu' });
      }
      const { user, token } = await authService.login({ email, password });
      return res.json({ success: true, message: 'Đăng nhập thành công', user, token });
    } catch (err) {
      return res.status(401).json({ success: false, message: err.message });
    }
  }

  async registerRestaurant(req, res) {
    try {
      // 1. Lấy thêm thông tin từ body
      const { email, password, full_name, phone, restaurant_address } = req.body;
      
      // 2. Kiểm tra đầu vào (thêm restaurant_address)
      if (!email || !password || !full_name || !phone || !restaurant_address) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký nhà hàng' });
      }
      // 3. GỌI HÀM CỦA userService (thay vì authService)
      // Hàm này sẽ tự động tạo user VÀ gửi sự kiện qua Redis
      const { user, message } = await userService.createRestaurantUser({
        email,
        password,
        phone,
        restaurant_name: full_name, // Ánh xạ full_name -> restaurant_name
        restaurant_address: restaurant_address,
      });

      // 4. Trả về kết quả
      return res.status(201).json({ 
        success: true, 
        message: message, // "Your account is pending approval."
        user 
      });

    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
  async logout(req, res) {
    try {
      // Lấy thông tin từ token đã được xác thực
      const userId = req.user.id;
      const userRole = req.user.role;
      
      await authService.logout(userId, userRole);
      
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuthController();
