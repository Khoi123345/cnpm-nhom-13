// src/repositories/productRepository.js
const mongoose = require('mongoose');

class ProductRepository {
    async createProduct(productData) {
        const Product = mongoose.models.Product;
        const product = new Product(productData);
        return await product.save();
    }

    async getProductById(productId) {
        const Product = mongoose.models.Product;
        return await Product.findById(productId).populate('restaurant');
    }

    async getAllProducts() {
        const Product = mongoose.models.Product;
        return await Product.find().populate('restaurant');
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
}

module.exports = new ProductRepository();
