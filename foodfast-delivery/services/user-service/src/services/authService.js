const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');

const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Đăng ký người dùng mới (CUSTOMER hoặc RESTAURANT)
   * @param {Object} payload - Thông tin đăng ký
   * @returns {Object} user + token
   */
  async registerUser({ email, password, full_name, phone, role = 'CUSTOMER' }) {
    // Kiểm tra đầu vào
    if (!email || !password || !full_name || !phone) {
      throw new Error('Thiếu thông tin đăng ký');
    }
    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email không hợp lệ');
    }
    // Kiểm tra password đủ mạnh
    if (password.length < 6) {
      throw new Error('Mật khẩu phải từ 6 ký tự');
    }
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email đã tồn tại');
    }
    // Hash mật khẩu
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    // Tạo user mới
    const newUser = await userRepository.create({
      email,
      password_hash,
      full_name,
      phone,
      role,
    });
    // Tạo JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
    // Trả kết quả
    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone,
        role: newUser.role,
      },
      token,
    };
  }

  /**
   * Đăng nhập người dùng
   * @param {Object} payload - Thông tin đăng nhập
   * @returns {Object} user + token
   */
  async login({ email, password }) {
    // Kiểm tra đầu vào
    if (!email || !password) {
      throw new Error('Thiếu email hoặc mật khẩu');
    }
    // Lấy user theo email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Email không tồn tại');
    }
    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Sai mật khẩu');
    }
    // Tạo JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    // Trả kết quả
    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  }
}

module.exports = new AuthService();