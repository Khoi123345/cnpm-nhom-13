const express = require('express');
const router = express.Router();

// Import controller và middleware
const restaurantController = require('../controller/restaurantController'); // Đảm bảo đường dẫn đúng
const { authenticate, authorize } = require('../middleware/authMiddleware'); // Đảm bảo đường dẫn đúng

// === ROUTE CHO ADMIN ===

/**
 * @route   POST /api/restaurants
 * @desc    Admin tạo nhà hàng mới và gán chủ sở hữu
 * @access  Private (ADMIN)
 */
router.post(
    '/',
    authenticate,          // Xác thực token
    authorize('ADMIN'),    // Phân quyền Admin
    restaurantController.createRestaurant 
);

// === ROUTE CHO CHỦ NHÀ HÀNG ===

/**
 * @route   GET /api/restaurants/my-restaurant
 * @desc    Chủ nhà hàng lấy thông tin nhà hàng của mình
 * @access  Private (RESTAURANT)
 */
router.get(
    '/my-restaurant', 
    authenticate,
    authorize('RESTAURANT'), // Chỉ chủ nhà hàng được gọi
    restaurantController.getMyRestaurant 
);

// === CÁC ROUTE CÔNG KHAI (hoặc cân nhắc) ===

/**
 * @route   GET /api/restaurants
 * @desc    Lấy danh sách tất cả nhà hàng (hiện tại public)
 * @access  Public
 */
// Cân nhắc: Có nên để public, hay chỉ user đăng nhập, hay chỉ Admin?
// Ví dụ: Chỉ user đăng nhập: router.get('/', authenticate, restaurantController.getAllRestaurants);
router.get('/', restaurantController.getAllRestaurants);

/**
 * @route   GET /api/restaurants/:id
 * @desc    Lấy chi tiết một nhà hàng theo ID (thường là public)
 * @access  Public
 */
router.get('/:id', restaurantController.getRestaurantById);

module.exports = router;