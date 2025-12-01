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

// ⭐️ Middleware: Khi xóa Restaurant thì CASCADE xóa tất cả Product
restaurantSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        const Product = require('./Product').Product;
        await Product.deleteMany({ restaurant: this._id });
        console.log(`[CASCADE] Đã xóa tất cả products của restaurant ${this._id}`);
        next();
    } catch (error) {
        next(error);
    }
});

restaurantSchema.pre('findOneAndDelete', async function(next) {
    try {
        const Product = require('./Product').Product;
        const restaurant = await this.model.findOne(this.getQuery());
        if (restaurant) {
            await Product.deleteMany({ restaurant: restaurant._id });
            console.log(`[CASCADE] Đã xóa tất cả products của restaurant ${restaurant._id}`);
        }
        next();
    } catch (error) {
        next(error);
    }
});

exports.Restaurant = mongoose.model('Restaurant', restaurantSchema);
