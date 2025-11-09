const restaurantRepository = require("../repositories/restaurantRepository.js");
const productRepository = require("../repositories/productRepository.js");

const productService = {
  // Tạo product mới, dựa trên ownerId để xác thực restaurant
  async createProduct(ownerId, productData) {
    const restaurant = await restaurantRepository.findByOwnerId(ownerId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    return await productRepository.createProduct({
      ...productData, // Đã bao gồm 'quantity' từ controller
      restaurant: restaurant._id,
    });
  },
  // Lấy tất cả product của restaurant dựa trên ownerId
  async getProductsForOwner(ownerId) {
    const restaurant = await restaurantRepository.findByOwnerId(ownerId);
    if (!restaurant) {
      throw new Error("Restaurant not found for this owner");
    }
    // Gọi hàm mới ở repository
    return await productRepository.findByRestaurantId(restaurant._id);
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
    
    if (!restaurant || product.restaurant._id.toString() !== restaurant._id.toString()) {
      throw new Error("You cannot update this product");
    }
    
    // updateData đã bao gồm 'quantity' từ controller
    return await productRepository.updateProduct(productId, updateData);
  },

  // Xóa product, chỉ cho phép owner của restaurant thao tác
  async deleteProduct(ownerId, productId) {
    const product = await productRepository.getProductById(productId);
    if (!product) throw new Error("Product not found");

    const restaurant = await restaurantRepository.findByOwnerId(ownerId);
    
    if (!restaurant || product.restaurant._id.toString() !== restaurant._id.toString()) {
      throw new Error("You cannot delete this product");
    }

    return await productRepository.deleteProduct(productId);
  },
  async checkStock(items) {
    const productIds = items.map(item => item.productId);
    const productsInDb = await productRepository.findByIds(productIds);
    
    let sufficient = true;
    const details = [];

    for (const item of items) {
        const product = productsInDb.find(p => p._id.toString() === item.productId);
        if (!product) {
            details.push({ productId: item.productId, status: "NOT_FOUND" });
            sufficient = false;
        } else if (product.quantity < item.quantity) {
            details.push({ productId: item.productId, status: "INSUFFICIENT", requested: item.quantity, available: product.quantity });
            sufficient = false;
        } else {
             details.push({ productId: item.productId, status: "OK", available: product.quantity });
        }
    }
    
    return { sufficient, details };
  },
  async handleStockUpdate(items) {
      try {
          console.log(`[ProductService] handleStockUpdate called with ${items.length} items:`, JSON.stringify(items, null, 2));
          
          if (!items || !Array.isArray(items) || items.length === 0) {
              console.error('[ProductService] Invalid items array:', items);
              throw new Error('Items array is required and must not be empty');
          }
          
          // Validate items structure
          for (const item of items) {
              if (!item.productId) {
                  console.error('[ProductService] Missing productId in item:', item);
                  throw new Error('productId is required in each item');
              }
              if (!item.quantity || item.quantity <= 0) {
                  console.error('[ProductService] Invalid quantity in item:', item);
                  throw new Error('quantity must be a positive number');
              }
          }
          
          const result = await productRepository.decrementStock(items);
          console.log(`✅ [ProductService] Stock update successful - ${result.modifiedCount} items updated out of ${items.length} requested.`);
          
          if (result.modifiedCount < items.length) {
              console.warn(`⚠️ [ProductService] Stock discrepancy detected. ${items.length} requested, ${result.modifiedCount} updated.`);
              console.warn(`[ProductService] Matched count: ${result.matchedCount}, Modified count: ${result.modifiedCount}`);
              // Ở đây, bạn có thể gửi 1 event khác (ví dụ: 'stock.update.failed') để thông báo cho các service khác
          }
          
          return result;
      } catch (err) {
          console.error('❌ [ProductService] Error decrementing stock:', err.message);
          console.error('❌ [ProductService] Error stack:', err.stack);
          throw err; // Re-throw để caller có thể xử lý
      }
  }
};

// Dùng module.exports thay vì export
module.exports = productService;