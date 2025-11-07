const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/users/me
 * @desc    Lấy thông tin người dùng hiện tại
 * @access  Private
 */
router.get('/me', authenticate, userController.getMe.bind(userController));

/**
 * @route   GET /api/v1/users
 * @desc    Lấy danh sách tất cả người dùng (có thể có filter, pagination)
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('ADMIN'), userController.getAllUsers.bind(userController));

/**
 * @route   POST /api/v1/users/admins
 * @desc    Tạo tài khoản admin mới
 * @access  Private (Admin only)
 */
router.post('/admins', authenticate, authorize('ADMIN'), userController.createAdmin.bind(userController));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Lấy thông tin người dùng theo ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticate, authorize('ADMIN'), userController.getUserById.bind(userController));

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Cập nhật thông tin người dùng
 * @access  Private (Chính chủ hoặc Admin)
 */
router.put('/:id', authenticate, userController.updateUser.bind(userController));

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Xoá tài khoản người dùng
 * @access  Private (Chính chủ hoặc Admin)
 */
router.delete('/:id', authenticate, userController.deleteUser.bind(userController));

module.exports = router;
