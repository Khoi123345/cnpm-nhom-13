const { restaurantRepository } = require("../repositories/restaurantRepository.js");
const { productRepository } = require("../repositories/productRepository.js");

const productService = {
  // Tạo product mới, dựa trên ownerId để xác thực restaurant
  async createProduct(ownerId, productData) {
    const restaurant = await restaurantRepository.findByOwnerId(ownerId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    return await productRepository.create({
      ...productData,
      restaurant: restaurant._id,
    });
  },

  // Lấy product theo id
  async getProductById(productId) {
    return await productRepository.getProductById(productId);
  },

  // Lấy tất cả product của tất cả nhà hàng
  async getAllProducts() {
    return await productRepository.getAllProducts();
  },

  // Cập nhật product, chỉ cho phép owner của restaurant thao tác
  async updateProduct(ownerId, productId, updateData) {
    const product = await productRepository.getProductById(productId);
    if (!product) throw new Error("Product not found");

    const restaurant = await restaurantRepository.findByOwnerId(ownerId);
    if (!restaurant || product.restaurant.toString() !== restaurant._id.toString()) {
      throw new Error("You cannot update this product");
    }

    return await productRepository.updateProduct(productId, updateData);
  },

  // Xóa product, chỉ cho phép owner của restaurant thao tác
  async deleteProduct(ownerId, productId) {
    const product = await productRepository.getProductById(productId);
    if (!product) throw new Error("Product not found");

    const restaurant = await restaurantRepository.findByOwnerId(ownerId);
    if (!restaurant || product.restaurant.toString() !== restaurant._id.toString()) {
      throw new Error("You cannot delete this product");
    }

    return await productRepository.deleteProduct(productId);
  },
};

// Dùng module.exports thay vì export
module.exports = productService;