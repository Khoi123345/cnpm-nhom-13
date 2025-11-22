// src/server.js

// 1. Load biến môi trường NGAY TỪ ĐẦU
require('dotenv').config();

// 2. Import các thư viện cần thiết
const express = require('express');
const cors = require('cors'); // Cho phép Cross-Origin Resource Sharing
const helmet = require('helmet'); // Tăng cường bảo mật cơ bản

// 3. Import các module tự viết
const connectDB = require('./config/database'); // Hàm kết nối MongoDB
const errorHandler = require('./middleware/errorHandler'); // Middleware xử lý lỗi
const productRoutes = require('./routes/productRoutes'); // Routes cho Product
const restaurantRoutes = require('./routes/restaurantRoutes'); // Routes cho Restaurant
const { startSubscriber } = require('./subscriber/messageBroker');

// --- KẾT NỐI DATABASE ---
connectDB(); 

require('./models/Restaurant');
require('./models/Product');

startSubscriber();

// --- KHỞI TẠO APP EXPRESS ---
const app = express();

// --- CÁC MIDDLEWARE CƠ BẢN ---
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
})); // Kích hoạt CORS với specific origins
app.use(helmet()); // Sử dụng các header bảo mật mặc định
app.use(express.json()); // Parse request body dạng JSON
app.use(express.urlencoded({ extended: false })); // Parse request body dạng URL-encoded

// --- GẮN CÁC ROUTES ---   
// Định nghĩa tiền tố chung cho các API endpoint
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/restaurants`, restaurantRoutes);

// Route cơ bản để kiểm tra server có chạy không
app.get('/', (req, res) => {
    res.send('Product Service is running...');
});

// --- GẮN ERROR HANDLER (PHẢI LUÔN Ở CUỐI CÙNG) ---
app.use(errorHandler);

// --- KHỞI CHẠY SERVER ---
const PORT = process.env.PORT || 3002; // Lấy PORT từ .env, mặc định 5002

app.listen(PORT, () => console.log(`🚀 Product service is listening on port ${PORT}`));
