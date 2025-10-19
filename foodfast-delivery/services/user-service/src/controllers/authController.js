const authService = require('../services/authService');

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
      const { email, password, full_name, phone } = req.body;
      // Kiểm tra đầu vào
      if (!email || !password || !full_name || !phone) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký nhà hàng' });
      }
      const { user, token } = await authService.registerUser({
        email,
        password,
        full_name,
        phone,
        role: 'RESTAURANT',
      });
      return res.status(201).json({ success: true, message: 'Đăng ký nhà hàng thành công', user, token });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuthController();