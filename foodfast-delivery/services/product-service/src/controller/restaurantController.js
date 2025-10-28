// src/controller/restaurantController.js

// Import service (đảm bảo đường dẫn đúng)
const RestaurantService = require('../services/restaurantService'); 

class RestaurantController {

    /**
     * @description Tạo nhà hàng mới (chỉ dành cho Admin)
     * @route POST /api/restaurants
     * @access Private (Admin)
     */
    async createRestaurant(req, res) {
        try {
            // 1. Lấy ownerId và dữ liệu nhà hàng từ req.body (do Admin gửi)
            const { ownerId, ...restaurantData } = req.body; 

            // 2. Kiểm tra xem Admin có gửi ownerId không
            if (!ownerId) {
                // Trả về lỗi 400 Bad Request nếu thiếu ownerId
                return res.status(400).json({ 
                    success: false, 
                    message: 'Bad Request: ownerId is required in the request body for Admin creation' 
                });
            }

            // 3. (Tùy chọn) Có thể thêm bước kiểm tra ownerId hợp lệ ở đây hoặc trong service

            // 4. Chuẩn bị dữ liệu đầy đủ để tạo nhà hàng
            // Đảm bảo tên trường 'ownerId' khớp với schema trong models/Restaurant.js
            const fullRestaurantData = { ...restaurantData, ownerId: ownerId }; 

            // 5. Gọi service để tạo nhà hàng
            const restaurant = await RestaurantService.createRestaurant(fullRestaurantData);
            
            // Trả về thông báo thành công (201 Created)
            return res.status(201).json({ 
                success: true, 
                message: 'Restaurant created successfully by Admin', 
                restaurant 
            });

        } catch (err) {
            // Trả về lỗi 400 nếu có lỗi (ví dụ: validation, lỗi DB)
            return res.status(400).json({ success: false, message: err.message });
        }
    }

    /**
     * @description Lấy thông tin nhà hàng theo ID (công khai)
     * @route GET /api/restaurants/:id
     * @access Public
     */
    async getRestaurantById(req, res) {
        try {
            const restaurantId = req.params.id;
            const restaurant = await RestaurantService.getRestaurantById(restaurantId);

            // Nếu không tìm thấy, trả về lỗi 404 Not Found
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            }

            // Trả về thông tin nhà hàng (200 OK mặc định)
            return res.json({ success: true, restaurant });
        } catch (err) {
            // Trả về lỗi 400 nếu có lỗi khác
            return res.status(400).json({ success: false, message: err.message });
        }
    }

    /**
     * @description Lấy danh sách tất cả nhà hàng (công khai hoặc cần bảo vệ tùy yêu cầu)
     * @route GET /api/restaurants
     * @access Public (Hiện tại)
     */
    async getAllRestaurants(req, res) {
        try {
            const restaurants = await RestaurantService.getAllRestaurants();
            // Trả về danh sách nhà hàng (200 OK mặc định)
            return res.json({ success: true, restaurants });
        } catch (err) {
            // Trả về lỗi 400 nếu có lỗi
            return res.status(400).json({ success: false, message: err.message });
        }
    }

    /**
     * @description Lấy thông tin nhà hàng của chính người dùng đang đăng nhập (chủ nhà hàng)
     * @route GET /api/restaurants/my-restaurant 
     * @access Private (Restaurant Owner)
     */
    async getMyRestaurant(req, res) { 
        try {
            // Lấy ownerId từ người dùng đã xác thực (chủ nhà hàng)
            const ownerId = req.user.id; 

            // Middleware 'authenticate' đã đảm bảo req.user.id tồn tại
            // if (!ownerId) { ... } // Không thực sự cần thiết nếu middleware đúng

            // Gọi service để tìm nhà hàng theo ownerId của người dùng đang đăng nhập
            const restaurant = await RestaurantService.findByOwnerId(ownerId); 
            
            // Nếu không tìm thấy nhà hàng cho chủ sở hữu này
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Restaurant not found for this owner' });
            }

            // Trả về thông tin nhà hàng (200 OK mặc định)
            return res.json({ success: true, restaurant });
        } catch (err) {
             // Trả về lỗi 400 nếu có lỗi
            return res.status(400).json({ success: false, message: err.message });
        }
    }

    // Các hàm khác (update, delete) có thể được thêm vào đây
    // Ví dụ: async updateMyRestaurant(req, res) { ... } (Chủ nhà hàng tự cập nhật)
    // Ví dụ: async updateRestaurantByAdmin(req, res) { ... } (Admin cập nhật)
    // Ví dụ: async deleteRestaurantByAdmin(req, res) { ... } (Admin xóa)
}

// Export instance của class Controller
module.exports = new RestaurantController();