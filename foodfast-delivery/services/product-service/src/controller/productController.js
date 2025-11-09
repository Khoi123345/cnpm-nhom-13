const productService = require('../services/productService');

class ProductController {
    async getAllProducts(req, res) {
        try {
            const products = await productService.getAllProducts();
            return res.json({ success: true, data: products });
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    }

    async getMyProducts(req, res) {
        try {
            const ownerId = req.user.id; // Lấy từ token
            const products = await productService.getProductsForOwner(ownerId);
            return res.json({ success: true, data: products });
        } catch (err) {
            let statusCode = 400;
            if (err.message === "Restaurant not found for this owner") statusCode = 404;
            return res.status(statusCode).json({ success: false, message: err.message });
        }
    }

    async createProduct(req, res) {
        try {
            // 2. PHẢI LẤY ownerId từ middleware xác thực
            const ownerId = req.user.id;
            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const productData = req.body;
            
            // Kiểm tra quantity (đảm bảo nó là số dương)
            if (productData.quantity === undefined || Number(productData.quantity) < 0) {
                 return res.status(400).json({ success: false, message: 'Quantity must be a non-negative number' });
            }
            
            const product = await productService.createProduct(ownerId, productData);
            
            return res.status(201).json({ success: true, message: 'Product created successfully', data: product });
        } catch (err) {
            const statusCode = err.message === "Restaurant not found" ? 404 : 400;
            return res.status(statusCode).json({ success: false, message: err.message });
        }
    }

    async getProductById(req, res) {
        try {
            const productId = req.params.id;
            const product = await productService.getProductById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            return res.json({ success: true, data: product });
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    }

    async updateProduct(req, res) {
        try {
            const ownerId = req.user.id; 
             if (!ownerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const productId = req.params.id;
            // ⭐️ SỬA: Đảm bảo 'quantity' được lấy từ body
            const updateData = req.body;
            
            // Kiểm tra quantity (nếu nó được cung cấp)
            if (updateData.quantity !== undefined && Number(updateData.quantity) < 0) {
                 return res.status(400).json({ success: false, message: 'Quantity must be a non-negative number' });
            }

            const updatedProduct = await productService.updateProduct(ownerId, productId, updateData);
            
            return res.json({ success: true, message: 'Product updated successfully', data: updatedProduct });
        } catch (err) {
            let statusCode = 400;
            if (err.message === "Product not found") statusCode = 404;
            if (err.message === "You cannot update this product") statusCode = 403; // 403 Forbidden
            
            return res.status(statusCode).json({ success: false, message: err.message });
        }
    }

    async deleteProduct(req, res) {
        try {
            // 2. PHẢI LẤY ownerId
            const ownerId = req.user.id; // Ví dụ: lấy từ req.user.id
             if (!ownerId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            
            const productId = req.params.id;

            // 3. Truyền CẢ HAI tham số
            await productService.deleteProduct(ownerId, productId);
            
            return res.json({ success: true, message: 'Product deleted successfully', data: null });
        } catch (err) {
            let statusCode = 400;
            if (err.message === "Product not found") statusCode = 404;
            if (err.message === "You cannot delete this product") statusCode = 403; // 403 Forbidden

            return res.status(statusCode).json({ success: false, message: err.message });
        }
    }
    async checkStock(req, res) {
        try {
            // req.body sẽ là: [{ productId: "...", quantity: 2 }, ...]
            const items = req.body.items;
            if (!items || !Array.isArray(items)) {
                 return res.status(400).json({ success: false, message: 'Invalid request body. "items" array is required.' });
            }
            
            const stockStatus = await productService.checkStock(items);
            
            // stockStatus sẽ là { sufficient: true/false, details: [...] }
            return res.json({ success: true, data: stockStatus });

        } catch (err) {
             return res.status(400).json({ success: false, message: err.message });
        }
    }
}

module.exports = new ProductController();
