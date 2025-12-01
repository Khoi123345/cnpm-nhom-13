const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    imageurl: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 0, // Mặc định là 0, chủ nhà hàng phải cập nhật
        min: 0      // Đảm bảo số lượng không bao giờ âm
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
}, { timestamps: true });

// ⭐️ Middleware: Khi xóa Restaurant thì tự động xóa tất cả Product thuộc Restaurant đó
productSchema.pre('deleteMany', async function(next) {
    // Hook này sẽ chạy khi gọi Product.deleteMany({ restaurant: restaurantId })
    next();
});

exports.Product = mongoose.model('Product', productSchema);
