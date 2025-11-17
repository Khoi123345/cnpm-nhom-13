// src/repositories/productRepository.js
const mongoose = require('mongoose');

class ProductRepository {
    async createProduct(productData) {
        const Product = mongoose.models.Product;
        const product = new Product(productData);
        return await product.save();
    }
    
    async findByRestaurantId(restaurantId) {
        const Product = mongoose.models.Product;
        return await Product.find({ restaurant: restaurantId }).populate('restaurant');
    }

    async getProductById(productId) {
        const Product = mongoose.models.Product;
        return await Product.findById(productId).populate('restaurant');
    }

    async getAllProducts() {
        const Product = mongoose.models.Product;
        return await Product.find().populate('restaurant');
    }

    async findByRestaurantIds(restaurantIds) {
        const Product = mongoose.models.Product;
        return await Product.find({ restaurant: { $in: restaurantIds } }).populate('restaurant');
    }

    async updateProduct(productId, updateData) {
        const Product = mongoose.models.Product;
        return await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        ).populate('restaurant');
    }

    async deleteProduct(productId) {
        const Product = mongoose.models.Product;
        return await Product.findByIdAndDelete(productId);
    }
    async findByIds(productIds) {
        const Product = mongoose.models.Product;
        return await Product.find({ _id: { $in: productIds } });
    }
    async decrementStock(items) {
        const Product = mongoose.models.Product;
        
        console.log(`[ProductRepository] Decrementing stock for ${items.length} items:`, JSON.stringify(items, null, 2));
        
        const operations = items.map(item => {
            // Convert productId (String) to ObjectId
            let productObjectId;
            try {
                // Nếu productId là string hợp lệ, convert sang ObjectId
                if (mongoose.Types.ObjectId.isValid(item.productId)) {
                    productObjectId = new mongoose.Types.ObjectId(item.productId);
                } else {
                    console.error(`[ProductRepository] Invalid ObjectId format: ${item.productId}`);
                    throw new Error(`Invalid productId format: ${item.productId}`);
                }
            } catch (error) {
                console.error(`[ProductRepository] Error converting productId to ObjectId: ${error.message}`);
                throw error;
            }
            
            console.log(`[ProductRepository] Processing item - productId: ${item.productId} (ObjectId: ${productObjectId}), quantity: ${item.quantity}`);
            
            return {
                updateOne: {
                    filter: { 
                        _id: productObjectId, 
                        // Đảm bảo không bị âm
                        quantity: { $gte: item.quantity } 
                    },
                    update: { 
                        $inc: { quantity: -item.quantity } 
                    }
                }
            };
        });

        console.log(`[ProductRepository] Executing bulkWrite with ${operations.length} operations...`);
        
        // Trả về kết quả của bulkWrite
        const result = await Product.bulkWrite(operations);
        
        console.log(`[ProductRepository] BulkWrite completed - matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
        
        return result;
    }
}

module.exports = new ProductRepository();
