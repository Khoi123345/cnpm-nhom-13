const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');


const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authController.register.bind(authController));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route   POST /api/v1/auth/register-restaurant
 * @desc    Register restaurant account
 * @access  Public
 */
router.post('/register-restaurant', authController.registerRestaurant.bind(authController));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (và gửi event nếu là nhà hàng)
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout.bind(authController));

module.exports = router;
