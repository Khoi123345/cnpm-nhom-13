const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    restaurantId: {
        type: String,
        required: true,
        unique: true,
    },
    owner_id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    isOnline: { 
        type: Boolean,
        default: false, // Mặc định là offline
    },
}, { timestamps: true });
exports.Restaurant = mongoose.model('Restaurant', restaurantSchema);
