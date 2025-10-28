const express = require('express');
const router = express.Router();

const productController = require('../controller/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// === CÁC ROUTE CÔNG KHAI ===
/**
 * @route   GET /api/products
 * @desc    Lấy danh sách tất cả sản phẩm
 * @access  Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Lấy chi tiết một sản phẩm theo ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);


// === CÁC ROUTE CẦN XÁC THỰC (Chỉ chủ nhà hàng) ===

/**
 * @route   POST /api/products
 * @desc    Tạo sản phẩm mới (chỉ chủ nhà hàng)
 * @access  Private (RESTAURANT)
 */
router.post(
    '/',
    authenticate,          // Bước 1: Xác thực token -> req.user
    authorize('RESTAURANT'), // Bước 2: Đảm bảo role là 'RESTAURANT'
    productController.createProduct // Bước 3: Chạy controller
);

/**
 * @route   PUT /api/products/:id
 * @desc    Cập nhật sản phẩm (chỉ chủ nhà hàng sở hữu sản phẩm đó)
 * @access  Private (RESTAURANT)
 */
router.put(
    '/:id',
    authenticate,
    authorize('RESTAURANT'),
    productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Xóa sản phẩm (chỉ chủ nhà hàng sở hữu sản phẩm đó)
 * @access  Private (RESTAURANT)
 */
router.delete(
    '/:id',
    authenticate,
    authorize('RESTAURANT'),
    productController.deleteProduct
);

module.exports = router;