// foodfast-delivery/frontend/lib/environment.ts

// ⭐️ TOÀN BỘ API_CONFIG ĐÃ BỊ XOÁ

export const API_ENDPOINTS = {
  // Auth (từ user-service, qua /api/auth/)
  AUTH_REGISTER: "/auth/register",
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER_RESTAURANT: "/auth/register-restaurant",
  AUTH_LOGOUT: "/auth/logout",

  // Products (từ product-service, qua /api/products/)
  GET_PRODUCTS: "/products",
  GET_PRODUCT_DETAIL: "/products/:id", // ⭐️ THÊM: Cho trang [productId]
  CREATE_PRODUCT: "/products",
  UPDATE_PRODUCT: "/products/:id",
  DELETE_PRODUCT: "/products/:id",
  GET_MY_PRODUCTS: "/products/my-products",

  // Restaurants (từ product-service, qua /api/restaurants/)
  GET_RESTAURANTS: "/restaurants",
  GET_RESTAURANT: "/restaurants/:id",
  CREATE_RESTAURANT: "/restaurants",
  GET_MY_RESTAURANT: "/restaurants/my-restaurant",

  // Orders (từ order-service, qua /api/orders/)
  CREATE_ORDER: "/orders/create", // ⭐️ SỬA: Khớp /order/create
  GET_ALL_ORDERS: "/orders/get/all", // ⭐️ THÊM: Cho admin analytics
  GET_USER_ORDERS: "/orders/get/byUser", // ⭐️ SỬA: Khớp /order/get/byUser
  GET_RESTAURANT_ORDERS: "/orders/get/byRestaurant", // ⭐️ THÊM: Cho restaurant handler
  UPDATE_ORDER_STATUS: "/orders/:id/status", // ⭐️ SỬA: Khớp /order/:id/status

  // Users (từ user-service, qua /api/users/)
  GET_USERS: "/users",
  GET_USER: "/users/:id",
  // (Endpoint cho 'approve' là /users/:id/approve, sẽ được nối thủ công)
}