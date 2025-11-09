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

exports.Product = mongoose.model('Product', productSchema);
