const userService = require('../services/userService');

class UserController {
  // Lấy thông tin user hiện tại
  async getMe(req, res, next) {
      try {
        const userId = req.user?.id; // ✅ Sửa lại dòng này
        if (!userId) {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await userService.findById(userId);
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: user });
      } catch (error) {
        next(error);
      }
    }

  // Lấy user theo ID
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing user ID' });
      }
      const user = await userService.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật thông tin user
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing user ID' });
      }
      if (userId !== id && userRole !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'You can only update your own profile' });
      }
      const { full_name, phone } = req.body;
      if (!full_name && !phone) {
        return res.status(400).json({ success: false, message: 'No update data provided' });
      }
      const updatedUser = await userService.updateUser(id, { full_name, phone });
      res.json({ success: true, message: 'User updated successfully', data: updatedUser });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // Xóa user
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing user ID' });
      }
      if (userId !== id && userRole !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'You can only delete your own account' });
      }
      await userService.deleteUser(id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // Lấy danh sách user (ADMIN)
  async getAllUsers(req, res, next) {
    try {
      const { role, isActive, page = 1, limit = 10 } = req.query;
      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return res.status(400).json({ success: false, message: 'Invalid page parameter. Must be a positive integer.' });
      }
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({ success: false, message: 'Invalid limit parameter. Must be between 1 and 100.' });
      }
      const filters = {};
      if (role) filters.role = role;
      if (isActive !== undefined) filters.isActive = isActive;
      const result = await userService.getAllUsers(filters, parsedPage, parsedLimit);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      if (error.message && error.message.includes('Invalid role filter')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // Tạo admin mới (ADMIN)
  async createAdmin(req, res, next) {
    try {
      const { email, password, full_name, phone } = req.body;
      if (!email || !password || !full_name || !phone) {
        return res.status(400).json({ success: false, message: 'All fields are required: email, password, full_name, phone' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      }
      const newAdmin = await userService.createAdmin({ email, password, full_name, phone });
      res.status(201).json({ success: true, message: 'Admin created successfully', data: newAdmin });
    } catch (error) {
      if (error.message === 'Email already exists') {
        return res.status(409).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new UserController();